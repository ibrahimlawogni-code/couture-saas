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
  /*
   * Etiquette de langue pour Intl : dates et nombres. En anglais, en-GB
   * plutot qu'en-US - le jour precede le mois, comme partout en Afrique de
   * l'Ouest, et une date inversee se lit de travers sans prevenir.
   */
  locale: string;
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
   * Replis et fragments partages par plusieurs ecrans. Ils vivaient dans la
   * section du tableau de bord, ou l'ecran des commandes serait alle les
   * chercher : deux ecrans qui lisent la meme phrase ne doivent pas la
   * ranger chacun chez soi.
   */
  clientInconnu: string;
  sansModele: string;
  /*
   * Les mesures : des parties du corps, pas du jargon. Partagees par la
   * fiche qui les affiche et le formulaire qui les prend.
   */
  mesuresChamps: Record<
    | "poitrine"
    | "taille"
    | "hanches"
    | "longueur_bras"
    | "longueur_jambe"
    | "col"
    | "epaule",
    string
  >;
  reste: (montant: string) => string;
  solde: string;
  annuler: string;
  enAttente: string;
  refuse: string;
  /*
   * Le nom de l'offre n'est pas traduit : « Atelier Pro » est un nom
   * commercial, pas une description. Seul ce qui l'entoure change.
   */
  offre: (nom: string) => string;
  /*
   * Le tableau de bord. Les accords sont portes par des fonctions parce
   * qu'ils ne suivent pas la meme regle d'une langue a l'autre : le
   * francais accorde a partir de deux, l'anglais des que ce n'est pas un.
   */
  bord: {
    /** Pourquoi une commande remonte dans « a traiter ». */
    motifs: Record<"en_retard" | "a_livrer" | "essayage" | "a_retirer", string>;
    salutationJour: string;
    salutationSoir: string;
    /** « pièce à livrer aujourd'hui », accorde au nombre. */
    aLivrer: (n: number) => string;
    enRetard: (n: number) => string;
    essayages: (n: number) => string;
    aucunRetard: string;
    nouvelleCommande: string;
    nouveauClient: string;
    aTraiter: string;
    toutVoir: string;
    rienUrgent: string;
    creances: string;
    surCommandes: (n: number) => string;
    toutSolde: string;
    relancer: string;
    clients: string;
    auTotal: string;
    aucunClient: string;
    avecPieceEnCours: (n: number) => string;
    aucunePieceEnCours: string;
    commandesEnCours: (n: number) => string;
    livreesCeMois: (n: number) => string;
    encaisseCeMois: string;
    surLeMois: (mois: string) => string;
    toucherBarre: string;
    evaluation: string;
    ponctualite: string;
    ponctualiteVide: string;
    surPiecesLivrees: (n: number) => string;
    retardMoyen: (jours: string, n: number) => string;
    satisfaction: string;
    satisfactionVide: string;
    surCinq: string;
    surAvis: (n: number) => string;
    chargement: string;
  };
  /** L'ecran des commandes, groupees par echeance. */
  commandes: {
    aucune: string;
    aucuneTexte: string;
    creerPremiere: string;
    enCours: (n: number) => string;
    horsLigne: string;
    ouEnEst: string;
    sansDate: string;
    passeA: (statut: string) => string;
    chargement: string;
  };
  /*
   * Moyens et natures de versement. Les codes restent en base ; seuls les
   * libelles changent. « Mobile Money » ne se traduit pas : c'est le nom du
   * service, pas une description.
   */
  methodes: Record<"especes" | "mobile_money" | "virement", string>;
  /** Titre du choix du moyen, partage par le formulaire, le detail et le bilan. */
  recuEn: string;
  typesPaiement: Record<"acompte" | "solde" | "complement", string>;
  /** Le detail d'une commande. */
  detail: {
    commande: string;
    statut: string;
    passerA: (statut: string) => string;
    avancementHorsLigne: string;
    aucunNumero: string;
    messageRecapitulatif: string;
    messageEssayage: string;
    messagePret: string;
    messageAvis: string;
    dates: string;
    essayage: string;
    livraison: string;
    nonDefinie: string;
    resteAPayer: string;
    paiement: string;
    soldeMajuscule: string;
    partEncaissee: string;
    prixTotal: string;
    dejaVerse: (pourcent: number) => string;
    montantRecu: string;
    ajouter: string;
    enAttenteSuffixe: string;
    photo: string;
    introuvable: string;
    introuvableTexte: string;
    chargement: string;
    /* Le bouton, pas le document : le recu lui-meme reste en francais. */
    partagerRecu: string;
    preparationRecu: string;
  };
  /** L'ecran des finances. */
  finances: {
    encaisseEn: (mois: string) => string;
    dontAcomptes: (montant: string) => string;
    commandesDuMois: string;
    prisesCeMois: (n: number) => string;
    creances: string;
    toutSolde: string;
    impayes: (n: number) => string;
    impayesSansAcompte: (n: number, sans: number) => string;
    aRecouvrer: string;
    aucunImpaye: string;
    rienVerse: string;
    partVersee: (pourcent: number) => string;
    chargement: string;
  };
  /** Les trois formulaires de creation : client, commande, mesures. */
  formulaires: {
    chargement: string;
    enregistrement: string;
    enregistrer: string;
    voirLesOffres: string;
    nom: string;
    nomObligatoire: string;
    telephone: string;
    whatsapp: string;
    aideWhatsapp: string;
    notes: string;
    client: string;
    choisirClient: string;
    aucunClient: string;
    aucunClientTexte: string;
    creerUnClient: string;
    modele: string;
    autreModele: string;
    preciserModele: string;
    exempleModele: string;
    photoModele: string;
    photoTissu: string;
    prixTotal: string;
    acompteVerse: string;
    acompteRecuEn: string;
    dateEssayage: string;
    dateLivraison: string;
    enregistrerCommande: string;
    libelleMesure: string;
    aideLibelleMesure: string;
    mesuresDefaut: string;
    mesuresStandard: string;
    aideCentimetres: string;
    champPersonnalise: string;
    aideChampPersonnalise: string;
    exempleNomMesure: string;
    valeur: string;
    sansNom: string;
    /** Un client encore dans la file d'envoi, dans la liste deroulante. */
    nomEnAttente: (nom: string) => string;
  };
  /** Les deux ecrans clients : le carnet et la fiche. */
  clientsEcran: {
    aucun: string;
    aucunTexte: string;
    creerPremier: string;
    chercher: string;
    chercherAria: string;
    effacer: string;
    aucunResultat: string;
    trouves: (n: number) => string;
    aucuneCorrespondance: (terme: string) => string;
    voirTous: string;
    pasDeTelephone: string;
    introuvable: string;
    introuvableTexte: string;
    doit: string;
    enCoursVignette: string;
    clientDepuis: string;
    boutonMesure: string;
    boutonCommande: string;
    dernieresMesures: string;
    aucuneMesure: string;
    historiqueMesures: string;
    commandes: string;
    aucuneCommande: string;
    enAttenteEnvoi: string;
    chargement: string;
  };
};

const FR: Traductions = {
  langues: { fr: "Français", en: "English" },
  locale: "fr-FR",
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
  clientInconnu: "Client inconnu",
  sansModele: "Sans modèle",
  mesuresChamps: {
    poitrine: "Poitrine",
    taille: "Taille",
    hanches: "Hanches",
    longueur_bras: "Longueur bras",
    longueur_jambe: "Longueur jambe",
    col: "Col",
    epaule: "Épaule",
  },
  reste: (montant) => `reste ${montant}`,
  solde: "soldé",
  annuler: "Annuler",
  enAttente: "En attente",
  refuse: "Refusé",
  offre: (nom) => `Offre ${nom}`,
  bord: {
    motifs: {
      en_retard: "En retard",
      a_livrer: "À livrer",
      essayage: "Essayage",
      a_retirer: "À retirer",
    },
    salutationJour: "Bonjour",
    salutationSoir: "Bonsoir",
    aLivrer: (n) => `${n > 1 ? "pièces" : "pièce"} à livrer aujourd'hui`,
    enRetard: (n) => `${n} en retard`,
    essayages: (n) => `${n} essayage${n > 1 ? "s" : ""} aujourd'hui`,
    aucunRetard: "Aucun retard",
    nouvelleCommande: "Nouvelle commande",
    nouveauClient: "Nouveau client",
    aTraiter: "Aujourd'hui et en retard",
    toutVoir: "Tout voir",
    rienUrgent:
      "Rien d'urgent aujourd'hui. Aucun retard, aucune livraison prévue, aucune commande en attente de retrait.",
    creances: "Créances",
    surCommandes: (n) => `sur ${n} commande${n > 1 ? "s" : ""}`,
    toutSolde: "tout est soldé",
    relancer: "Relancer",
    clients: "Clients",
    auTotal: "au total",
    aucunClient: "aucun client enregistré",
    avecPieceEnCours: (n) => `dont ${n} avec une pièce en cours`,
    aucunePieceEnCours: "aucune pièce en cours",
    commandesEnCours: (n) => `commande${n > 1 ? "s" : ""} en cours`,
    livreesCeMois: (n) => `livrée${n > 1 ? "s" : ""} ce mois`,
    encaisseCeMois: "Encaissé ce mois",
    surLeMois: (mois) => `sur ${mois}`,
    toucherBarre: "Touchez une barre pour voir le montant exact.",
    evaluation: "Évaluation de l'atelier",
    ponctualite: "Ponctualité",
    ponctualiteVide:
      "Rien à mesurer pour l'instant. Le score apparaîtra dès qu'une commande datée sera passée à « Livré ».",
    surPiecesLivrees: (n) =>
      `sur ${n} pièce${n > 1 ? "s" : ""} livrée${n > 1 ? "s" : ""}`,
    retardMoyen: (jours, n) => ` · retard moyen ${jours} jour${n >= 2 ? "s" : ""}`,
    satisfaction: "Satisfaction",
    satisfactionVide:
      "Aucun avis reçu. Le lien de notation s'envoie sur WhatsApp depuis une commande livrée.",
    surCinq: "sur 5",
    surAvis: (n) => `sur ${n} avis`,
    chargement: "Chargement du tableau de bord",
  },
  commandes: {
    aucune: "Aucune commande",
    aucuneTexte:
      "Chaque commande suit son avancement ici, de la réception à la livraison.",
    creerPremiere: "Créer la première commande",
    enCours: (n) => `${n} en cours`,
    horsLigne:
      "Hors connexion : l'avancement des commandes reprendra au retour du réseau.",
    ouEnEst: "Où en est l'atelier",
    sansDate: "Sans date",
    passeA: (statut) => `Passé à ${statut} · envoyé`,
    chargement: "Chargement des commandes",
  },
  recuEn: "Reçu en",
  finances: {
    encaisseEn: (mois) => `Encaissé en ${mois}`,
    dontAcomptes: (montant) => `dont ${montant} d'acomptes`,
    commandesDuMois: "Commandes du mois",
    prisesCeMois: (n) => `${n} commande${n > 1 ? "s" : ""} prise${n > 1 ? "s" : ""}`,
    creances: "Créances",
    toutSolde: "tout est soldé",
    impayes: (n) => `${n} commande${n > 1 ? "s" : ""}`,
    impayesSansAcompte: (n, sans) => `${n} commandes · ${sans} sans acompte`,
    aRecouvrer: "À recouvrer",
    aucunImpaye: "Aucun impayé. Toutes les commandes sont soldées.",
    rienVerse: "rien versé",
    partVersee: (pourcent) => `${pourcent} % versé`,
    chargement: "Chargement du bilan",
  },
  methodes: {
    especes: "Espèces",
    mobile_money: "Mobile Money",
    virement: "Virement",
  },
  typesPaiement: {
    acompte: "acompte",
    solde: "solde",
    complement: "complément",
  },
  detail: {
    commande: "Commande",
    statut: "Statut",
    passerA: (statut) => `Passer à : ${statut}`,
    avancementHorsLigne:
      "L'avancement du statut demande une connexion : il modifie une commande déjà enregistrée, et la file locale ne sait rejouer que des créations.",
    aucunNumero: "Aucun numéro enregistré pour ce client.",
    messageRecapitulatif: "Envoyer le récapitulatif",
    messageEssayage: "Rappeler l'essayage",
    messagePret: "Prévenir que c'est prêt",
    messageAvis: "Demander un avis",
    dates: "Dates",
    essayage: "Essayage",
    livraison: "Livraison",
    nonDefinie: "Non définie",
    resteAPayer: "Reste à payer",
    paiement: "Paiement",
    soldeMajuscule: "Soldé",
    partEncaissee: "Part du prix déjà encaissée",
    prixTotal: "Prix total",
    dejaVerse: (pourcent) => `Déjà versé · ${pourcent} %`,
    montantRecu: "Montant reçu",
    ajouter: "Ajouter",
    enAttenteSuffixe: " · en attente",
    photo: "Photo de la commande",
    introuvable: "Commande introuvable",
    introuvableTexte:
      "Cette commande n'est pas dans les données enregistrées sur cet appareil. Si elle a été créée ailleurs, elle apparaîtra au prochain passage en ligne.",
    chargement: "Chargement de la commande",
    partagerRecu: "Partager le reçu",
    preparationRecu: "Préparation...",
  },
  formulaires: {
    chargement: "Chargement...",
    enregistrement: "Enregistrement...",
    enregistrer: "Enregistrer",
    voirLesOffres: "Voir les offres",
    nom: "Nom",
    nomObligatoire: "Le nom est obligatoire",
    telephone: "Téléphone",
    whatsapp: "WhatsApp",
    aideWhatsapp: "Laissez vide si c'est le même numéro que le téléphone.",
    notes: "Notes",
    client: "Client",
    choisirClient: "Choisir un client",
    aucunClient: "Aucun client à qui rattacher la commande",
    aucunClientTexte:
      "Une commande appartient toujours à un client : c'est sa fiche qui porte les mesures.",
    creerUnClient: "Créer un client",
    modele: "Modèle",
    autreModele: "Autre…",
    preciserModele: "Préciser le modèle",
    exempleModele: "Boubou brodé, tenue de mariée...",
    photoModele: "Photo modèle",
    photoTissu: "Photo tissu",
    prixTotal: "Prix total (FCFA)",
    acompteVerse: "Acompte versé",
    acompteRecuEn: "Acompte reçu en",
    dateEssayage: "Date d'essayage",
    dateLivraison: "Date de livraison",
    enregistrerCommande: "Enregistrer la commande",
    libelleMesure: "Libellé",
    aideLibelleMesure:
      "Pour retrouver ces mesures plus tard : « Boubou », « Costume »…",
    mesuresDefaut: "Mesures",
    mesuresStandard: "Mesures standard",
    aideCentimetres:
      "Toutes les valeurs en centimètres. Laissez vide ce que vous ne prenez pas.",
    champPersonnalise: "Champ personnalisé",
    aideChampPersonnalise:
      "Pour une mesure propre à votre pratique. Les deux cases doivent être remplies pour être enregistrées.",
    exempleNomMesure: "Tour de cuisse",
    valeur: "Valeur",
    sansNom: "Sans nom",
    nomEnAttente: (nom) => `${nom} (en attente)`,
  },
  clientsEcran: {
    aucun: "Aucun client",
    aucunTexte:
      "Créez une fiche client pour enregistrer ses mesures et lui ouvrir des commandes.",
    creerPremier: "Créer le premier client",
    chercher: "Chercher un nom ou un numéro...",
    chercherAria: "Chercher un client",
    effacer: "Effacer la recherche",
    aucunResultat: "Aucun résultat",
    trouves: (n) => `${n} client${n > 1 ? "s" : ""} trouvé${n > 1 ? "s" : ""}`,
    aucuneCorrespondance: (terme) => `Aucun client ne correspond à « ${terme} ».`,
    voirTous: "Voir tous les clients",
    pasDeTelephone: "Pas de téléphone",
    introuvable: "Client introuvable",
    introuvableTexte:
      "Cette fiche n'est pas dans les données enregistrées sur cet appareil. Si elle a été créée ailleurs, elle apparaîtra au prochain passage en ligne.",
    doit: "Doit",
    enCoursVignette: "En cours",
    clientDepuis: "Client depuis",
    boutonMesure: "Mesure",
    boutonCommande: "Commande",
    dernieresMesures: "Dernières mesures",
    aucuneMesure:
      "Aucune mesure enregistrée. Prenez-les une fois, elles serviront à toutes les commandes suivantes.",
    historiqueMesures: "Historique des mesures",
    commandes: "Commandes",
    aucuneCommande: "Aucune commande pour ce client.",
    enAttenteEnvoi: "En attente d'envoi",
    chargement: "Chargement de la fiche",
  },
};

/*
 * Anglais d'Afrique de l'Ouest, pas de tailleur londonien. « Fitting » est
 * le mot du metier pour l'essayage, et « Ready for pickup » dit ce que le
 * client doit faire, la ou « Ready » seul laisserait croire a une livraison.
 */
const EN: Traductions = {
  langues: { fr: "Français", en: "English" },
  locale: "en-GB",
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
  clientInconnu: "Unknown client",
  sansModele: "No model",
  mesuresChamps: {
    poitrine: "Chest",
    taille: "Waist",
    hanches: "Hips",
    longueur_bras: "Arm length",
    longueur_jambe: "Leg length",
    col: "Neck",
    epaule: "Shoulder",
  },
  reste: (montant) => `${montant} left`,
  solde: "paid",
  annuler: "Undo",
  enAttente: "Pending",
  refuse: "Rejected",
  offre: (nom) => `${nom} plan`,
  bord: {
    motifs: {
      en_retard: "Overdue",
      a_livrer: "Due today",
      essayage: "Fitting",
      a_retirer: "For pickup",
    },
    salutationJour: "Good morning",
    salutationSoir: "Good evening",
    aLivrer: (n) => `${n === 1 ? "item" : "items"} to deliver today`,
    enRetard: (n) => `${n} overdue`,
    essayages: (n) => `${n} fitting${n === 1 ? "" : "s"} today`,
    aucunRetard: "Nothing overdue",
    nouvelleCommande: "New order",
    nouveauClient: "New client",
    aTraiter: "Today and overdue",
    toutVoir: "See all",
    rienUrgent:
      "Nothing urgent today. Nothing overdue, no delivery due, no order waiting for pickup.",
    creances: "Owed to you",
    surCommandes: (n) => `across ${n} order${n === 1 ? "" : "s"}`,
    toutSolde: "everything is paid",
    relancer: "Chase payment",
    clients: "Clients",
    auTotal: "in total",
    aucunClient: "no client yet",
    avecPieceEnCours: (n) => `${n} with an item in progress`,
    aucunePieceEnCours: "no item in progress",
    commandesEnCours: (n) => `order${n === 1 ? "" : "s"} in progress`,
    // L'anglais n'accorde pas ici : le nombre precede, le participe non.
    livreesCeMois: () => "delivered this month",
    encaisseCeMois: "Received this month",
    surLeMois: (mois) => `vs ${mois}`,
    toucherBarre: "Tap a bar to see the exact amount.",
    evaluation: "Workshop score",
    ponctualite: "On-time delivery",
    ponctualiteVide:
      "Nothing to measure yet. The score appears once a dated order has been marked “Delivered”.",
    surPiecesLivrees: (n) => `across ${n} delivered item${n === 1 ? "" : "s"}`,
    retardMoyen: (jours, n) =>
      ` · ${jours} day${n >= 2 ? "s" : ""} late on average`,
    satisfaction: "Satisfaction",
    satisfactionVide:
      "No review yet. The rating link is sent on WhatsApp from a delivered order.",
    surCinq: "out of 5",
    surAvis: (n) => `from ${n} review${n === 1 ? "" : "s"}`,
    chargement: "Loading the dashboard",
  },
  commandes: {
    aucune: "No orders yet",
    aucuneTexte:
      "Every order follows its progress here, from intake to delivery.",
    creerPremiere: "Create the first order",
    enCours: (n) => `${n} in progress`,
    horsLigne:
      "Offline: moving orders forward will resume when the network is back.",
    ouEnEst: "Where the workshop stands",
    sansDate: "No date",
    passeA: (statut) => `Moved to ${statut} · sent`,
    chargement: "Loading orders",
  },
  recuEn: "Received in",
  finances: {
    encaisseEn: (mois) => `Received in ${mois}`,
    dontAcomptes: (montant) => `including ${montant} in deposits`,
    commandesDuMois: "Orders this month",
    prisesCeMois: (n) => `${n} order${n === 1 ? "" : "s"} taken`,
    creances: "Owed to you",
    toutSolde: "everything is paid",
    impayes: (n) => `${n} order${n === 1 ? "" : "s"}`,
    impayesSansAcompte: (n, sans) => `${n} orders · ${sans} with no deposit`,
    aRecouvrer: "To collect",
    aucunImpaye: "Nothing unpaid. Every order is settled.",
    rienVerse: "nothing paid",
    partVersee: (pourcent) => `${pourcent} % paid`,
    chargement: "Loading the summary",
  },
  methodes: {
    especes: "Cash",
    mobile_money: "Mobile Money",
    virement: "Bank transfer",
  },
  typesPaiement: {
    acompte: "deposit",
    solde: "balance",
    complement: "part payment",
  },
  detail: {
    commande: "Order",
    statut: "Status",
    passerA: (statut) => `Move to: ${statut}`,
    avancementHorsLigne:
      "Moving the status forward needs a connection: it changes an order already saved, and the local queue only replays new entries.",
    aucunNumero: "No number saved for this client.",
    messageRecapitulatif: "Send the summary",
    messageEssayage: "Remind about the fitting",
    messagePret: "Tell them it is ready",
    messageAvis: "Ask for a review",
    dates: "Dates",
    essayage: "Fitting",
    livraison: "Delivery",
    nonDefinie: "Not set",
    resteAPayer: "Left to pay",
    paiement: "Payment",
    soldeMajuscule: "Paid",
    partEncaissee: "Share of the price already received",
    prixTotal: "Total price",
    dejaVerse: (pourcent) => `Already paid · ${pourcent} %`,
    montantRecu: "Amount received",
    ajouter: "Add",
    enAttenteSuffixe: " · pending",
    photo: "Order photo",
    introuvable: "Order not found",
    introuvableTexte:
      "This order is not among the data saved on this device. If it was created elsewhere, it will appear the next time you are online.",
    chargement: "Loading the order",
    partagerRecu: "Share the receipt",
    preparationRecu: "Preparing...",
  },
  formulaires: {
    chargement: "Loading...",
    enregistrement: "Saving...",
    enregistrer: "Save",
    voirLesOffres: "See the plans",
    nom: "Name",
    nomObligatoire: "The name is required",
    telephone: "Phone",
    whatsapp: "WhatsApp",
    aideWhatsapp: "Leave empty if it is the same as the phone number.",
    notes: "Notes",
    client: "Client",
    choisirClient: "Choose a client",
    aucunClient: "No client to attach the order to",
    aucunClientTexte:
      "An order always belongs to a client: their file is what holds the measurements.",
    creerUnClient: "Create a client",
    modele: "Model",
    autreModele: "Other…",
    preciserModele: "Describe the model",
    exempleModele: "Embroidered boubou, wedding outfit...",
    photoModele: "Model photo",
    photoTissu: "Fabric photo",
    prixTotal: "Total price (FCFA)",
    acompteVerse: "Deposit paid",
    acompteRecuEn: "Deposit received in",
    dateEssayage: "Fitting date",
    dateLivraison: "Delivery date",
    enregistrerCommande: "Save the order",
    libelleMesure: "Label",
    aideLibelleMesure:
      "To find these measurements later: “Boubou”, “Suit”…",
    mesuresDefaut: "Measurements",
    mesuresStandard: "Standard measurements",
    aideCentimetres:
      "All values in centimetres. Leave blank whatever you do not take.",
    champPersonnalise: "Custom field",
    aideChampPersonnalise:
      "For a measurement of your own. Both boxes must be filled to be saved.",
    exempleNomMesure: "Thigh",
    valeur: "Value",
    sansNom: "No name",
    nomEnAttente: (nom) => `${nom} (pending)`,
  },
  clientsEcran: {
    aucun: "No clients yet",
    aucunTexte:
      "Create a client file to record their measurements and open orders for them.",
    creerPremier: "Create the first client",
    chercher: "Search a name or a number...",
    chercherAria: "Search a client",
    effacer: "Clear the search",
    aucunResultat: "No result",
    trouves: (n) => `${n} client${n === 1 ? "" : "s"} found`,
    aucuneCorrespondance: (terme) => `No client matches “${terme}”.`,
    voirTous: "See all clients",
    pasDeTelephone: "No phone number",
    introuvable: "Client not found",
    introuvableTexte:
      "This file is not among the data saved on this device. If it was created elsewhere, it will appear the next time you are online.",
    doit: "Owes",
    enCoursVignette: "In progress",
    clientDepuis: "Client since",
    boutonMesure: "Measurement",
    boutonCommande: "Order",
    dernieresMesures: "Latest measurements",
    aucuneMesure:
      "No measurements yet. Take them once and they will serve every order that follows.",
    historiqueMesures: "Measurement history",
    commandes: "Orders",
    aucuneCommande: "No order for this client yet.",
    enAttenteEnvoi: "Waiting to be sent",
    chargement: "Loading the client file",
  },
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

/*
 * Formateur de nombres, un par langue et mis en cache.
 *
 * Construire un Intl.NumberFormat coute environ cent fois le formatage
 * lui-meme : le construire a chaque appel avait deja ete corrige une fois
 * sur les montants, il n'y a pas de raison de le refaire ici. La carte
 * garde au plus une instance par langue.
 */
const FORMATEURS = new Map<string, Intl.NumberFormat>();

export function formateurNombre(locale: string): Intl.NumberFormat {
  let formateur = FORMATEURS.get(locale);
  if (!formateur) {
    formateur = new Intl.NumberFormat(locale);
    FORMATEURS.set(locale, formateur);
  }
  return formateur;
}
