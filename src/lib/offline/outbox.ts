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

export async function marquerTentative(
  operation: Operation,
  echec: boolean,
  motif?: string,
  rejouable?: boolean
) {
  const base = await ouvrirBase();
  await base.put("outbox", {
    ...operation,
    tentatives: operation.tentatives + 1,
    echec,
    motif,
    rejouable,
  });
  notifier();
}

/**
 * Au-dela, l'echec est tenu pour acquis.
 *
 * La reconnexion emet aussi a la simple restauration de session, donc a
 * chaque chargement de page. Sans plafond, une ligne que la base refuse
 * vraiment repartirait indefiniment : cinq tentatives a chaque ouverture
 * de l'application, en bloquant la file a chaque fois.
 */
const REPRISES_MAX = 3;

/**
 * Remet dans la file les operations dont l'echec tenait a la session.
 *
 * Le compteur de tentatives repart de zero : ce qui a echoue faute de
 * droit n'a jamais eu sa chance, et lui laisser ses cinq essais deja
 * consommes la ferait retomber en echec au premier hoquet suivant.
 *
 * Renvoie le nombre d'operations reprises, pour que l'appelant sache s'il
 * vaut la peine de relancer une synchronisation.
 */
export async function reprendreLesEchecs() {
  const base = await ouvrirBase();
  const operations = await listerFile();

  const reprises = operations.filter(
    (operation) =>
      operation.echec &&
      operation.rejouable &&
      (operation.reprises ?? 0) < REPRISES_MAX
  );

  if (reprises.length === 0) return 0;

  const transaction = base.transaction("outbox", "readwrite");
  await Promise.all(
    reprises.map((operation) =>
      transaction.store.put({
        ...operation,
        echec: false,
        rejouable: undefined,
        motif: undefined,
        tentatives: 0,
        reprises: (operation.reprises ?? 0) + 1,
      })
    )
  );
  await transaction.done;

  notifier();
  return reprises.length;
}
