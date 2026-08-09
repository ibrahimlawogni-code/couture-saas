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

// Copie locale des donnees de l'atelier : c'est elle que lisent les ecrans,
// ce qui rend l'application utilisable sans reseau.
export type LigneAtelier = {
  id: string;
  nom: string;
};

export type LigneClient = {
  id: string;
  nom: string;
  telephone: string | null;
  whatsapp: string | null;
  notes: string | null;
  created_at: string;
};

export type LigneMesure = {
  id: string;
  client_id: string;
  libelle: string;
  valeurs: Record<string, unknown>;
  created_at: string;
};

export type LigneCommande = {
  id: string;
  client_id: string;
  nom_modele: string | null;
  statut: string;
  prix_total: number;
  date_essayage: string | null;
  date_livraison: string | null;
  photo_modele_url: string | null;
  photo_tissu_url: string | null;
  created_at: string;
};

export type LignePaiement = {
  id: string;
  commande_id: string;
  montant: number;
  type: string;
  created_at: string;
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
  ateliers: {
    key: string;
    value: LigneAtelier;
  };
  clients: {
    key: string;
    value: LigneClient;
  };
  mesures: {
    key: string;
    value: LigneMesure;
    indexes: { "par-client": string };
  };
  commandes: {
    key: string;
    value: LigneCommande;
    indexes: { "par-client": string };
  };
  paiements: {
    key: string;
    value: LignePaiement;
    indexes: { "par-commande": string };
  };
}

const VERSION = 2;

let instance: Promise<IDBPDatabase<SchemaCouture>> | null = null;

export function ouvrirBase() {
  if (!instance) {
    instance = openDB<SchemaCouture>("couture-offline", VERSION, {
      upgrade(base, ancienneVersion) {
        if (ancienneVersion < 1) {
          const outbox = base.createObjectStore("outbox", { keyPath: "id" });
          outbox.createIndex("par-sequence", "sequence");
          outbox.createIndex("par-table", "table");
          base.createObjectStore("compteurs");
        }

        if (ancienneVersion < 2) {
          base.createObjectStore("ateliers", { keyPath: "id" });
          base.createObjectStore("clients", { keyPath: "id" });

          const mesures = base.createObjectStore("mesures", { keyPath: "id" });
          mesures.createIndex("par-client", "client_id");

          const commandes = base.createObjectStore("commandes", { keyPath: "id" });
          commandes.createIndex("par-client", "client_id");

          const paiements = base.createObjectStore("paiements", { keyPath: "id" });
          paiements.createIndex("par-commande", "commande_id");
        }
      },
    });
  }

  return instance;
}
