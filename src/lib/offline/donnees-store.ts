import { EVENEMENT_OUTBOX } from "./outbox";
import {
  EVENEMENT_MIROIR,
  lireAtelier,
  lireClients,
  lireAvis,
  lireCommandes,
  lireHistorique,
  lireMesures,
  lirePaiements,
  rafraichirMiroir,
  type AvecAttente,
} from "./miroir";
import { ouvrirBase, type LigneMesure } from "./db";
import type {
  LigneAtelier,
  LigneClient,
  LigneAvis,
  LigneCommande,
  LigneHistorique,
  LignePaiement,
} from "./db";

export type Donnees = {
  chargee: boolean;
  atelier: LigneAtelier | null;
  clients: AvecAttente<LigneClient>[];
  mesures: AvecAttente<LigneMesure>[];
  commandes: AvecAttente<LigneCommande>[];
  paiements: AvecAttente<LignePaiement>[];
  /** Les passages a « Livre », dates. Voir lireHistorique. */
  historique: LigneHistorique[];
  /** Les notes laissees par les clients. */
  avis: LigneAvis[];
};

const VIDE: Donnees = {
  chargee: false,
  atelier: null,
  clients: [],
  mesures: [],
  commandes: [],
  paiements: [],
  historique: [],
  avis: [],
};

let etat: Donnees = VIDE;
let initialise = false;

const abonnes = new Set<() => void>();

async function toutesLesMesures(): Promise<AvecAttente<LigneMesure>[]> {
  const base = await ouvrirBase();
  const enregistrees = await base.getAll("mesures");
  const clients = await lireClients();

  // lireMesures fusionne deja la file locale, client par client.
  const parClient = await Promise.all(
    clients.map((client) => lireMesures(client.id))
  );

  const attente = parClient.flat().filter((mesure) => mesure.enAttente);
  return [...enregistrees, ...attente];
}

async function recharger() {
  const [atelier, clients, mesures, commandes, paiements, historique, avis] =
    await Promise.all([
      lireAtelier(),
      lireClients(),
      toutesLesMesures(),
      lireCommandes(),
      lirePaiements(),
      lireHistorique(),
      lireAvis(),
    ]);

  etat = {
    chargee: true,
    atelier,
    clients,
    mesures,
    commandes,
    paiements,
    historique,
    avis,
  };
  abonnes.forEach((notifier) => notifier());
}

function initialiser() {
  if (initialise) return;
  initialise = true;

  window.addEventListener(EVENEMENT_MIROIR, recharger);
  window.addEventListener(EVENEMENT_OUTBOX, recharger);
  window.addEventListener("online", () => {
    rafraichirMiroir();
  });

  // Affichage immediat depuis la copie locale, mise a jour ensuite.
  recharger();
  if (navigator.onLine) rafraichirMiroir();
}

export function souscrireDonnees(notifier: () => void) {
  initialiser();
  abonnes.add(notifier);
  return () => {
    abonnes.delete(notifier);
  };
}

export function lireDonnees() {
  return etat;
}

/** Le rendu serveur n'a pas acces au stockage du navigateur. */
export function lireDonneesServeur() {
  return VIDE;
}
