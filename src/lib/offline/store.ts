import { EVENEMENT_OUTBOX, listerFile } from "./outbox";
import { synchroniser } from "./sync";
import type { Operation } from "./db";

export type EtatFile = {
  horsLigne: boolean;
  operations: Operation[];
};

const ETAT_INITIAL: EtatFile = { horsLigne: false, operations: [] };
const RELANCE_MS = 30_000;

let etat: EtatFile = ETAT_INITIAL;
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
