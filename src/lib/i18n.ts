import type { GroupeEcheance, Priorite, Statut } from "./commandes";

/*
 * Les mots de l'application, par langue.
 *
 * Ils vivent ici et non aupres de la logique qui les emploie : commandes.ts
 * garde les codes et les regles, ce fichier garde le vocabulaire. Un statut
 * reste « recu » en base quelle que soit la langue ; seul son libelle change.
 *
 * La langue est portee par l'atelier, pas par le compte. Les documents qui
 * sortent - recus, messages WhatsApp - doivent suivre la meme langue quel
 * que soit l'apprenti qui les produit.
 *
 * Le type Traductions est la garantie qui compte : ajouter une entree en
 * francais sans son equivalent anglais ne compile pas. Une table de
 * traduction se degrade autrement au fil des ajouts, et le manque ne se
 * decouvre qu'a l'ecran, dans la mauvaise langue.
 */

export const LANGUES = ["fr", "en"] as const;

export type Langue = (typeof LANGUES)[number];

export const LANGUE_PAR_DEFAUT: Langue = "fr";

export function estLangue(valeur: unknown): valeur is Langue {
  return typeof valeur === "string" && (LANGUES as readonly string[]).includes(valeur);
}

export type Traductions = {
  /** Nom de chaque langue, ecrit dans cette langue : un anglophone doit
   *  reconnaitre « English » meme sur une interface francaise. */
  langues: Record<Langue, string>;
  statuts: Record<Statut, string>;
  /*
   * Forme breve, pour les colonnes etroites de la repartition. Chaque
   * langue decide de ses abreviations : « Pret a retirer » se raccourcit en
   * « Pret », mais « Ready for pickup » ne se raccourcit pas au meme
   * endroit, et une regle commune aurait tronque de travers.
   */
  statutsCourts: Record<Statut, string>;
  priorites: Record<Priorite, string>;
  groupes: Record<GroupeEcheance, string>;
  /*
   * Les phrases prennent la forme de fonctions plutot que de gabarits a
   * trous : chaque langue place ses valeurs ou sa grammaire l'exige, et
   * TypeScript verifie qu'aucun argument ne manque.
   */
  jalonEtape: (rang: number, total: number, libelle: string) => string;
  champLangue: string;
  aideLangue: string;
  /*
   * La coque : onglets, barre laterale, en-tete. Elle s'affiche sur chaque
   * ecran, c'est donc elle qu'on lit le plus souvent.
   */
  onglets: Record<"accueil" | "commandes" | "clients" | "finances", string>;
  navigationPrincipale: string;
  reglages: string;
  deconnexion: string;
  monAtelier: string;
  /*
   * Le nom de l'offre n'est pas traduit : « Atelier Pro » est un nom
   * commercial, pas une description. Seul ce qui l'entoure change.
   */
  offre: (nom: string) => string;
};

const FR: Traductions = {
  langues: { fr: "Français", en: "English" },
  statuts: {
    recu: "Reçu",
    coupe: "Coupe",
    couture: "Couture",
    essayage: "Essayage",
    finitions: "Finitions",
    pret: "Prêt à retirer",
    livre: "Livré",
  },
  statutsCourts: {
    recu: "Reçu",
    coupe: "Coupe",
    couture: "Couture",
    essayage: "Essayage",
    finitions: "Finitions",
    pret: "Prêt",
    livre: "Livré",
  },
  priorites: {
    en_retard: "En retard",
    urgent: "À livrer bientôt",
    normal: "Dans les temps",
  },
  groupes: {
    en_retard: "En retard",
    aujourdhui: "Aujourd'hui",
    cette_semaine: "Cette semaine",
    plus_tard: "Plus tard",
    sans_date: "Sans date",
    livre: "Livré",
  },
  jalonEtape: (rang, total, libelle) => `Étape ${rang} sur ${total} : ${libelle}`,
  champLangue: "Langue de l'atelier",
  aideLangue:
    "Elle vaut pour tout l'atelier, y compris les apprentis. Les reçus et messages envoyés aux clients restent en français pour l'instant.",
  onglets: {
    accueil: "Accueil",
    commandes: "Commandes",
    clients: "Clients",
    finances: "Finances",
  },
  navigationPrincipale: "Navigation principale",
  reglages: "Réglages",
  deconnexion: "Déconnexion",
  monAtelier: "Mon atelier",
  offre: (nom) => `Offre ${nom}`,
};

/*
 * Anglais d'Afrique de l'Ouest, pas de tailleur londonien. « Fitting » est
 * le mot du metier pour l'essayage, et « Ready for pickup » dit ce que le
 * client doit faire, la ou « Ready » seul laisserait croire a une livraison.
 */
const EN: Traductions = {
  langues: { fr: "Français", en: "English" },
  statuts: {
    recu: "Received",
    coupe: "Cutting",
    couture: "Sewing",
    essayage: "Fitting",
    finitions: "Finishing",
    pret: "Ready for pickup",
    livre: "Delivered",
  },
  statutsCourts: {
    recu: "Received",
    coupe: "Cutting",
    couture: "Sewing",
    essayage: "Fitting",
    finitions: "Finishing",
    pret: "Ready",
    livre: "Delivered",
  },
  priorites: {
    en_retard: "Overdue",
    urgent: "Due soon",
    normal: "On track",
  },
  groupes: {
    en_retard: "Overdue",
    aujourdhui: "Today",
    cette_semaine: "This week",
    plus_tard: "Later",
    sans_date: "No date",
    livre: "Delivered",
  },
  jalonEtape: (rang, total, libelle) => `Step ${rang} of ${total}: ${libelle}`,
  champLangue: "Workshop language",
  aideLangue:
    "It applies to the whole workshop, apprentices included. Receipts and messages sent to clients stay in French for now.",
  onglets: {
    accueil: "Home",
    commandes: "Orders",
    clients: "Clients",
    finances: "Money",
  },
  navigationPrincipale: "Main navigation",
  reglages: "Settings",
  deconnexion: "Sign out",
  monAtelier: "My workshop",
  offre: (nom) => `${nom} plan`,
};

const TABLES: Record<Langue, Traductions> = { fr: FR, en: EN };

/**
 * Les mots, dans la langue demandee.
 *
 * Tolerante a l'entree : la langue arrive d'une colonne, d'un cache local ou
 * d'une session pas encore chargee, et une valeur inattendue doit rendre
 * l'application francaise plutot que vide.
 */
export function traduire(langue: unknown): Traductions {
  return estLangue(langue) ? TABLES[langue] : FR;
}
