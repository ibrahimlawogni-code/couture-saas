import { envoyerVersSupabase } from "./envoi";
import { estRefusDefinitif, estRefusDeDroit, messageRefus } from "./erreurs";
import { poserDansMiroir } from "./miroir";
import { listerFile, marquerTentative, retirerDeLaFile } from "./outbox";

const TENTATIVES_MAX = 5;

let enCours = false;

export type ResultatSync = {
  envoyees: number;
  restantes: number;
};

/**
 * Rejoue la file dans l'ordre d'enregistrement. S'arrete a la premiere
 * operation qui echoue, pour ne jamais envoyer une commande avant le
 * client auquel elle se rattache.
 */
export async function synchroniser(): Promise<ResultatSync> {
  if (enCours) {
    return { envoyees: 0, restantes: (await listerFile()).length };
  }

  enCours = true;
  let envoyees = 0;

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

  return { envoyees, restantes: (await listerFile()).length };
}
