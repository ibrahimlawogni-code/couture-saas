import { createClient } from "@/lib/supabase/client";
import { listerFile } from "./outbox";
import {
  ouvrirBase,
  type TableSynchronisable,
  type LigneAtelier,
  type LigneAvis,
  type LigneClient,
  type LigneCommande,
  type LigneHistorique,
  type LigneMesure,
  type LignePaiement,
} from "./db";

export const EVENEMENT_MIROIR = "miroir-mis-a-jour";

/** Une ligne encore dans la file locale : affichee, mais signalee. */
export type AvecAttente<T> = T & { enAttente?: boolean; enEchec?: boolean };

function notifier() {
  window.dispatchEvent(new Event(EVENEMENT_MIROIR));
}

/**
 * Telecharge les donnees de l'atelier dans le stockage local. Le volume
 * d'un atelier (quelques centaines de lignes) tient largement en memoire,
 * un rechargement complet evite donc toute logique de reconciliation.
 */
export async function rafraichirMiroir() {
  const supabase = createClient();

  const [ateliers, clients, mesures, commandes, paiements, historique, avis] =
    await Promise.all([
      supabase
        .from("ateliers")
        .select("id, nom, formule, langue, telephone, whatsapp_number"),
      supabase.from("clients").select("id, nom, telephone, whatsapp, notes, created_at"),
      supabase.from("mesures").select("id, client_id, libelle, valeurs, created_at"),
      supabase
        .from("commandes")
        .select(
          "id, client_id, nom_modele, statut, prix_total, date_essayage, date_livraison, photo_modele_url, photo_tissu_url, jeton_avis, created_at"
        ),
      supabase
        .from("paiements")
        .select("id, commande_id, montant, type, methode, created_at"),
      /*
       * Seuls les passages a « Livre » sont rapatries. L'historique
       * complet compte sept lignes par commande, dont six qu'aucun ecran
       * ne lit ; sur deux cents commandes cela ferait mille deux cents
       * lignes telechargees a chaque ouverture, sur une connexion qui est
       * deja le point faible du produit.
       */
      supabase
        .from("historique_statuts")
        .select("id, commande_id, statut, created_at")
        .eq("statut", "livre"),
      supabase
        .from("avis")
        .select("id, commande_id, note, commentaire, created_at"),
    ]);

  if (
    ateliers.error ||
    clients.error ||
    mesures.error ||
    commandes.error ||
    paiements.error ||
    historique.error ||
    avis.error
  ) {
    return false;
  }

  const base = await ouvrirBase();
  const transaction = base.transaction(
    [
      "ateliers",
      "clients",
      "mesures",
      "commandes",
      "paiements",
      "historique",
      "avis",
    ],
    "readwrite"
  );

  await Promise.all([
    transaction.objectStore("ateliers").clear(),
    transaction.objectStore("clients").clear(),
    transaction.objectStore("mesures").clear(),
    transaction.objectStore("commandes").clear(),
    transaction.objectStore("paiements").clear(),
    transaction.objectStore("historique").clear(),
    transaction.objectStore("avis").clear(),
  ]);

  await Promise.all([
    ...(ateliers.data ?? []).map((ligne) =>
      transaction.objectStore("ateliers").put(ligne as LigneAtelier)
    ),
    ...(clients.data ?? []).map((ligne) =>
      transaction.objectStore("clients").put(ligne as LigneClient)
    ),
    ...(mesures.data ?? []).map((ligne) =>
      transaction.objectStore("mesures").put(ligne as LigneMesure)
    ),
    ...(commandes.data ?? []).map((ligne) =>
      transaction.objectStore("commandes").put(ligne as LigneCommande)
    ),
    ...(paiements.data ?? []).map((ligne) =>
      transaction.objectStore("paiements").put(ligne as LignePaiement)
    ),
    ...(historique.data ?? []).map((ligne) =>
      transaction.objectStore("historique").put(ligne as LigneHistorique)
    ),
    ...(avis.data ?? []).map((ligne) =>
      transaction.objectStore("avis").put(ligne as LigneAvis)
    ),
  ]);

  await transaction.done;
  notifier();

  return true;
}

/**
 * Range une ligne dans la copie locale sans repasser par le serveur.
 *
 * Les ecrans de detail ne lisent que cette copie. Une ecriture partie
 * directement vers Supabase doit donc y etre reportee, sinon la ligne
 * existe en base mais reste invisible jusqu'au prochain rechargement
 * complet de la page.
 */
export async function poserDansMiroir(
  table: TableSynchronisable,
  ligne: Record<string, unknown>
) {
  if (!ligne?.id) return;

  const base = await ouvrirBase();
  await base.put(table, ligne as never);
  notifier();
}

/** Lignes de la file locale pour une table, presentees comme des lignes reelles. */
async function lignesEnAttente<T>(table: string): Promise<AvecAttente<T>[]> {
  const operations = await listerFile();

  return operations
    .filter((operation) => operation.table === table)
    .map((operation) => ({
      ...(operation.donnees as T),
      enAttente: !operation.echec,
      enEchec: operation.echec,
    }));
}

export async function lireAtelier(): Promise<LigneAtelier | null> {
  const base = await ouvrirBase();
  const ateliers = await base.getAll("ateliers");
  return ateliers[0] ?? null;
}

export async function lireClients(): Promise<AvecAttente<LigneClient>[]> {
  const base = await ouvrirBase();
  const enregistres = await base.getAll("clients");
  const attente = await lignesEnAttente<LigneClient>("clients");

  return [...enregistres, ...attente].sort((a, b) => a.nom.localeCompare(b.nom));
}

export async function lireClient(
  id: string
): Promise<AvecAttente<LigneClient> | null> {
  const base = await ouvrirBase();
  const enregistre = await base.get("clients", id);
  if (enregistre) return enregistre;

  const attente = await lignesEnAttente<LigneClient>("clients");
  return attente.find((client) => client.id === id) ?? null;
}

export async function lireMesures(
  clientId: string
): Promise<AvecAttente<LigneMesure>[]> {
  const base = await ouvrirBase();
  const enregistrees = await base.getAllFromIndex("mesures", "par-client", clientId);
  const attente = (await lignesEnAttente<LigneMesure>("mesures")).filter(
    (mesure) => mesure.client_id === clientId
  );

  return [...enregistrees, ...attente].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  );
}

export async function lireCommandes(): Promise<AvecAttente<LigneCommande>[]> {
  const base = await ouvrirBase();
  const enregistrees = await base.getAll("commandes");
  const attente = await lignesEnAttente<LigneCommande>("commandes");

  return [...enregistrees, ...attente];
}

export async function lireCommandesDuClient(clientId: string) {
  return (await lireCommandes()).filter((commande) => commande.client_id === clientId);
}

export async function lirePaiements(): Promise<AvecAttente<LignePaiement>[]> {
  const base = await ouvrirBase();
  const enregistres = await base.getAll("paiements");
  const attente = await lignesEnAttente<LignePaiement>("paiements");

  return [...enregistres, ...attente];
}

/*
 * Les livraisons datees. Pas de file locale a fusionner : cette table est
 * ecrite par un declencheur en base, jamais depuis l'appareil.
 */
export async function lireHistorique(): Promise<LigneHistorique[]> {
  const base = await ouvrirBase();
  return base.getAll("historique");
}

/*
 * Les notes des clients. Ecrites depuis la page publique, jamais d'ici :
 * pas de file locale a fusionner non plus.
 */
export async function lireAvis(): Promise<LigneAvis[]> {
  const base = await ouvrirBase();
  return base.getAll("avis");
}
