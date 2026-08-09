import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export const TABLES_SYNCHRONISABLES = [
  "clients",
  "mesures",
  "commandes",
  "paiements",
] as const;

export type TableSynchronisable = (typeof TABLES_SYNCHRONISABLES)[number];

export type PhotoEnAttente = {
  /** Chemin de destination dans le bucket, deja connu a la mise en file. */
  chemin: string;
  blob: Blob;
};

export type Operation = {
  id: string;
  /** Ordre d'enregistrement : garantit qu'un client part avant sa commande. */
  sequence: number;
  table: TableSynchronisable;
  donnees: Record<string, unknown>;
  photos: PhotoEnAttente[];
  tentatives: number;
  echec: boolean;
  creeLe: number;
};

interface SchemaCouture extends DBSchema {
  outbox: {
    key: string;
    value: Operation;
    indexes: { "par-sequence": number; "par-table": string };
  };
  compteurs: {
    key: string;
    value: number;
  };
}

let instance: Promise<IDBPDatabase<SchemaCouture>> | null = null;

export function ouvrirBase() {
  if (!instance) {
    instance = openDB<SchemaCouture>("couture-offline", 1, {
      upgrade(base) {
        const outbox = base.createObjectStore("outbox", { keyPath: "id" });
        outbox.createIndex("par-sequence", "sequence");
        outbox.createIndex("par-table", "table");
        base.createObjectStore("compteurs");
      },
    });
  }

  return instance;
}
