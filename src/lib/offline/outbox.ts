import {
  ouvrirBase,
  type Operation,
  type PhotoEnAttente,
  type TableSynchronisable,
} from "./db";

const CLE_SEQUENCE = "sequence";

/** Evenement local : permet aux vues d'afficher la file sans rechargement. */
export const EVENEMENT_OUTBOX = "outbox-modifiee";

function notifier() {
  window.dispatchEvent(new Event(EVENEMENT_OUTBOX));
}

async function prochaineSequence() {
  const base = await ouvrirBase();
  const transaction = base.transaction("compteurs", "readwrite");
  const actuelle = (await transaction.store.get(CLE_SEQUENCE)) ?? 0;
  const suivante = actuelle + 1;
  await transaction.store.put(suivante, CLE_SEQUENCE);
  await transaction.done;
  return suivante;
}

export async function mettreEnFile(
  table: TableSynchronisable,
  donnees: Record<string, unknown>,
  photos: PhotoEnAttente[] = []
) {
  const base = await ouvrirBase();

  const operation: Operation = {
    id: crypto.randomUUID(),
    sequence: await prochaineSequence(),
    table,
    donnees,
    photos,
    tentatives: 0,
    echec: false,
    creeLe: Date.now(),
  };

  await base.put("outbox", operation);
  notifier();

  return operation;
}

export async function listerFile(): Promise<Operation[]> {
  const base = await ouvrirBase();
  return base.getAllFromIndex("outbox", "par-sequence");
}

export async function listerPourTable(table: TableSynchronisable) {
  const operations = await listerFile();
  return operations.filter((operation) => operation.table === table);
}

export async function retirerDeLaFile(id: string) {
  const base = await ouvrirBase();
  await base.delete("outbox", id);
  notifier();
}

export async function marquerTentative(operation: Operation, echec: boolean) {
  const base = await ouvrirBase();
  await base.put("outbox", {
    ...operation,
    tentatives: operation.tentatives + 1,
    echec,
  });
  notifier();
}
