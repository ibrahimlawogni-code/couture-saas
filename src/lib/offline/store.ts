import { createClient } from "@/lib/supabase/client";
import { EVENEMENT_OUTBOX, listerFile, reprendreLesEchecs } from "./outbox";
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

async function tenterSynchronisation() {
  definir({ horsLigne: !navigator.onLine });

  if (navigator.onLine) {
    await synchroniser();
  }

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
   * SIGNED_IN couvre la reconnexion manuelle, TOKEN_REFRESHED le
   * rafraichissement automatique du jeton.
   */
  createClient().auth.onAuthStateChange((evenement) => {
    if (evenement !== "SIGNED_IN" && evenement !== "TOKEN_REFRESHED") return;

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
