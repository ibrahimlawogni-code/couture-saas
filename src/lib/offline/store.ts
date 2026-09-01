import { createClient } from "@/lib/supabase/client";
import { EVENEMENT_OUTBOX, listerFile, reprendreLesEchecs } from "./outbox";
import { sessionRetrouvee } from "./session";
import { synchroniser } from "./sync";
import type { Operation } from "./db";

export type EtatFile = {
  horsLigne: boolean;
  operations: Operation[];
};

const ETAT_INITIAL: EtatFile = { horsLigne: false, operations: [] };
const RELANCE_MS = 30_000;

/*
 * L'etat de depart cote navigateur repond deja a la question du reseau.
 *
 * Il valait « en ligne » jusqu'a ce que initialiser() consulte
 * navigator.onLine, ce qui n'arrive qu'a l'abonnement, donc apres le
 * premier rendu. Tout ce qui lisait cet etat pendant l'hydratation croyait
 * donc a une connexion, hors reseau comme ailleurs.
 */
let etat: EtatFile =
  typeof navigator === "undefined"
    ? ETAT_INITIAL
    : { ...ETAT_INITIAL, horsLigne: !navigator.onLine };

let initialise = false;

const abonnes = new Set<() => void>();

function definir(partiel: Partial<EtatFile>) {
  etat = { ...etat, ...partiel };
  abonnes.forEach((notifier) => notifier());
}

async function recharger() {
  definir({ operations: await listerFile() });
}

/*
 * navigator.onLine ne dit que l'existence d'une route, jamais qu'elle mene
 * quelque part. Sur la borne wifi d'un maquis dont le forfait est epuise,
 * il repond « en ligne » pendant que rien ne passe, et la bande d'etat
 * affirmait alors que le travail etait parti.
 *
 * C'est donc l'envoi qui tranche, puisque lui seul touche vraiment la
 * base. Pas de sondage periodique pour autant : il couterait des donnees
 * a un public qui les compte, alors que la file dit deja ce qu'il faut.
 */
async function tenterSynchronisation() {
  if (!navigator.onLine) {
    definir({ horsLigne: true });
    await recharger();
    return;
  }

  const { reseauMuet } = await synchroniser();
  definir({ horsLigne: reseauMuet });
  await recharger();
}

function initialiser() {
  if (initialise) return;
  initialise = true;

  window.addEventListener("online", tenterSynchronisation);
  window.addEventListener("offline", () => definir({ horsLigne: true }));
  window.addEventListener(EVENEMENT_OUTBOX, recharger);

  // Sur un reseau mobile instable, l'evenement "online" n'est pas toujours
  // emis : une relance periodique evite qu'une file reste bloquee.
  setInterval(() => {
    if (etat.operations.length > 0) tenterSynchronisation();
  }, RELANCE_MS);

  /*
   * Une session retrouvee relance ce qu'un defaut de droit avait fait
   * echouer. Sans cela, une saisie faite hors ligne pendant que le jeton
   * expirait restait morte dans la file : la personne voyait « Refusé »
   * et n'avait plus qu'a la retaper, alors que sa reconnexion venait
   * precisement de lever l'obstacle.
   *
   * Les trois evenements comptent, et INITIAL_SESSION plus que les autres :
   * c'est lui, et non SIGNED_IN, que la bibliotheque emet quand une session
   * deja ouverte est restauree au chargement de la page. Il manquait ici, et
   * le conseil affiche a la personne - « reconnectez-vous, la saisie
   * repartira d'elle-meme » - ne pouvait donc jamais etre suivi : revenir
   * avec une session valable n'emet rien d'autre qu'INITIAL_SESSION, et
   * l'operation restait refusee a demeure.
   *
   * Le detail du choix vit dans sessionRetrouvee, isole pour etre eprouve
   * au banc : c'est ce predicat qui avait mange la saisie.
   */
  createClient().auth.onAuthStateChange((evenement, session) => {
    if (!sessionRetrouvee(evenement, session)) return;

    reprendreLesEchecs().then((reprises) => {
      if (reprises > 0) tenterSynchronisation();
    });
  });

  tenterSynchronisation();
}

export function souscrire(notifier: () => void) {
  initialiser();
  abonnes.add(notifier);
  return () => {
    abonnes.delete(notifier);
  };
}

export function lireEtat() {
  return etat;
}

/** Le rendu serveur ne connait ni le reseau ni la file locale. */
export function lireEtatServeur() {
  return ETAT_INITIAL;
}
