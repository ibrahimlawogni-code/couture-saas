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
  /** Raison du dernier refus, en francais, pour l'afficher telle quelle. */
  motif?: string;
  /**
   * Vrai si l'echec tient a la session et non a la saisie : une
   * reconnexion remet alors l'operation dans la file.
   *
   * Tous les echecs ne se valent pas. Une limite d'offre atteinte ou une
   * contrainte violee ne changera pas d'avis parce qu'on se reconnecte ;
   * la rejouer ferait resurgir une fiche que la personne a deja vue
   * refusee et sur laquelle elle est passee a autre chose.
   */
  rejouable?: boolean;
  /**
   * Nombre de fois que l'operation a deja ete remise dans la file par une
   * reconnexion. Borne : sans elle, une ligne reellement interdite serait
   * ressuscitee a chaque restauration de session, echouerait a nouveau, et
   * bloquerait la file a chaque chargement de page sans jamais aboutir.
   */
  reprises?: number;
  creeLe: number;
};

// Copie locale des donnees de l'atelier : c'est elle que lisent les ecrans,
// ce qui rend l'application utilisable sans reseau.
export type LigneAtelier = {
  id: string;
  nom: string;
  /** Code de la formule. La base reste seule juge des limites. */
  formule: string;
  /*
   * Coordonnees portees par le recu remis au client. Elles suivent la copie
   * locale plutot que le serveur : un recu se prepare souvent au comptoir,
   * sans reseau, et un pied de page vide serait pire que pas de pied.
   */
  telephone: string | null;
  whatsapp_number: string | null;
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
  /*
   * Porte le lien de notation envoye au client. Absent des commandes
   * saisies hors ligne : la base le pose a l'insertion, et la copie locale
   * ne le connait qu'au retour du miroir.
   */
  jeton_avis?: string;
  created_at: string;
};

export type LignePaiement = {
  id: string;
  commande_id: string;
  montant: number;
  type: string;
  /*
   * Especes, Mobile Money ou virement. Optionnel a la lecture : les
   * versements enregistres avant que l'application ne pose ce champ n'en
   * portent aucun, et la base leur a mis « especes » par defaut sans que
   * personne l'ait dit.
   */
  methode?: string | null;
  created_at: string;
};

/*
 * Un passage d'etape, date.
 *
 * C'est la seule trace de la date de livraison *reelle* : commandes ne
 * porte que la date *prevue*. Sans cette table, l'application ne peut ni
 * dire si une piece est sortie a temps, ni compter les livraisons du mois -
 * elle ne connait que des promesses, jamais leur tenue.
 *
 * Alimentee par un declencheur en base a chaque changement de statut : rien
 * n'est ecrit d'ici, la copie locale est en lecture seule.
 */
export type LigneHistorique = {
  id: string;
  commande_id: string;
  statut: string;
  created_at: string;
};

/*
 * Une note laissee par un client. Ecrite par lui depuis la page publique,
 * jamais depuis l'application : la copie locale est en lecture seule.
 */
export type LigneAvis = {
  id: string;
  commande_id: string;
  note: number;
  commentaire: string | null;
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
  historique: {
    key: string;
    value: LigneHistorique;
    indexes: { "par-commande": string };
  };
  avis: {
    key: string;
    value: LigneAvis;
    indexes: { "par-commande": string };
  };
}

const VERSION = 3;

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

        if (ancienneVersion < 3) {
          const historique = base.createObjectStore("historique", {
            keyPath: "id",
          });
          historique.createIndex("par-commande", "commande_id");

          const avis = base.createObjectStore("avis", { keyPath: "id" });
          avis.createIndex("par-commande", "commande_id");
        }
      },
    });
  }

  return instance;
}
