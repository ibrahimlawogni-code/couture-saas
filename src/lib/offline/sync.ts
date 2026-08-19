import { envoyerVersSupabase } from "./envoi";
import {
  estPanneReseau,
  estRefusDefinitif,
  estRefusDeDroit,
  messageRefus,
} from "./erreurs";
import { poserDansMiroir } from "./miroir";
import { listerFile, marquerTentative, retirerDeLaFile } from "./outbox";

const TENTATIVES_MAX = 5;

let enCours = false;

/*
 * Dernier verdict rendu sur le reseau, conserve entre deux passages.
 *
 * Une file vide ne prouve rien : sans envoi a tenter, rien ne dit que la
 * connexion est revenue, et repondre « en ligne » par defaut ferait
 * clignoter la bande d'etat a chaque relance. Le verdict ne change donc
 * que sur preuve - un envoi passe, ou un envoi que le reseau n'a pas porte.
 */
let reseauMuetConnu = false;

export type ResultatSync = {
  envoyees: number;
  restantes: number;
  /** Vrai si le reseau se declare present mais ne porte rien. */
  reseauMuet: boolean;
};

/**
 * Rejoue la file dans l'ordre d'enregistrement. S'arrete a la premiere
 * operation qui echoue, pour ne jamais envoyer une commande avant le
 * client auquel elle se rattache.
 */
export async function synchroniser(): Promise<ResultatSync> {
  if (enCours) {
    return {
      envoyees: 0,
      restantes: (await listerFile()).length,
      reseauMuet: reseauMuetConnu,
    };
  }

  enCours = true;
  let envoyees = 0;
  let reseauMuet = false;

  try {
    for (const operation of await listerFile()) {
      if (operation.echec) continue;

      try {
        const ligne = await envoyerVersSupabase(
          operation.table,
          operation.donnees,
          operation.photos
        );
        // La ligne passe de la file a la copie locale avant d'etre retiree
        // de la file, sinon elle disparait de l'ecran entre les deux.
        await poserDansMiroir(operation.table, ligne);
        await retirerDeLaFile(operation.id);
        envoyees += 1;
      } catch (erreur) {
        /*
         * Le reseau n'a pas porte la requete : rien n'a ete refuse, donc
         * rien a compter. Les tentatives bornent les refus du serveur, pas
         * l'absence de reseau.
         *
         * Les compter revenait a condamner la saisie : cinq essais espaces
         * de trente secondes suffisaient a marquer l'operation en echec, et
         * un echec de reseau n'etant pas un echec de droit, la reconnexion
         * ne la reprenait jamais. Deux minutes et demie de wifi sourd, et
         * la fiche du client etait perdue sans que rien ne soit invalide.
         *
         * Une file bloquee ici est le comportement voulu : si le reseau ne
         * porte rien, tout ce qui attend derriere echouerait pareillement.
         */
        if (estPanneReseau(erreur)) {
          reseauMuet = true;
          break;
        }

        // Refus de principe : inutile de compter les tentatives, et
        // inutile d'arreter la file. Les operations qui dependaient de
        // celle-ci seront refusees a leur tour, les autres passeront.
        if (estRefusDefinitif(erreur)) {
          await marquerTentative(operation, true, messageRefus(erreur));
          continue;
        }

        // Le motif n'est pose qu'a l'epuisement des tentatives : tant
        // qu'il en reste, rien n'est encore refuse et l'ecran n'a pas a
        // annoncer un echec qui ne s'est pas produit.
        //
        // Un echec de droit est marque comme rejouable : la reconnexion
        // le remettra dans la file plutot que de le laisser mort.
        const definitif = operation.tentatives + 1 >= TENTATIVES_MAX;
        await marquerTentative(
          operation,
          definitif,
          definitif ? messageRefus(erreur) : undefined,
          definitif ? estRefusDeDroit(erreur) : undefined
        );
        break;
      }
    }
  } finally {
    enCours = false;
  }

  // Un envoi passe prouve que la connexion porte, un envoi perdu qu'elle
  // ne porte pas. Sans ni l'un ni l'autre, le verdict precedent tient.
  if (envoyees > 0 || reseauMuet) reseauMuetConnu = reseauMuet;

  return {
    envoyees,
    restantes: (await listerFile()).length,
    reseauMuet: reseauMuetConnu,
  };
}
