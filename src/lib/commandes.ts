export const STATUTS = [
  "recu",
  "coupe",
  "couture",
  "essayage",
  "finitions",
  "pret",
  "livre",
] as const;

export type Statut = (typeof STATUTS)[number];

/*
 * Les libelles ont quitte ce fichier pour i18n.ts, ou ils existent dans
 * chaque langue. Ce module garde les codes et les regles : un statut reste
 * « recu » en base quelle que soit la langue de l'atelier.
 */

export function statutSuivant(statut: Statut): Statut | null {
  const index = STATUTS.indexOf(statut);
  return index >= 0 && index < STATUTS.length - 1 ? STATUTS[index + 1] : null;
}

/*
 * Les modeles courants de l'atelier, proposes a la saisie d'une commande.
 *
 * La liste ferme le cas frequent sans fermer la porte : le formulaire offre
 * un choix « Autre » qui rend la saisie libre. Un tailleur coud aussi des
 * pieces qui ne sont dans aucune liste, et l'obliger a choisir entre neuf
 * cases lui ferait ranger une robe de mariee sous « Robe (Moderne) ».
 *
 * Le champ reste du texte libre en base : rien ici n'est une contrainte,
 * seulement un raccourci. Les commandes deja saisies gardent leur libelle.
 */
export const MODELES = [
  "3 Pièces (AGBADA)",
  "BOMBA (Manche courte)",
  "BOMBA (Manche longue)",
  "BOMBA Femme",
  "Chemise",
  "Chemise + pantalon (Moderne)",
  "Chemise + pantalon (Pagne)",
  "Robe (Moderne)",
  "Robe (Pagne)",
] as const;

/*
 * Valeur sentinelle du choix « Autre ». Volontairement impossible a
 * confondre avec un nom de modele reel.
 */
export const MODELE_AUTRE = "__autre__";

export type Priorite = "en_retard" | "urgent" | "normal";

/** Compare la date de livraison a aujourd'hui pour situer l'urgence. */
export function priorite(dateLivraison: string | null, statut: Statut): Priorite {
  if (!dateLivraison || statut === "livre") return "normal";

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  const livraison = new Date(dateLivraison);
  livraison.setHours(0, 0, 0, 0);

  const joursRestants = Math.round(
    (livraison.getTime() - aujourdhui.getTime()) / 86_400_000
  );

  if (joursRestants < 0) return "en_retard";
  if (joursRestants <= 2) return "urgent";
  return "normal";
}

/*
 * Trois degres d'urgence, trois tons distincts. Le bleu est exclu ici :
 * il est reserve aux messages du systeme, alors qu'une echeance concerne le
 * metier du tailleur.
 *
 * Le ton plutot que les classes : l'etiquette tient la correspondance
 * entre un ton et ses deux couleurs, et c'est elle qui garantit que le
 * texte reste lisible sur son fond.
 */
export const TON_PRIORITE: Record<Priorite, "probleme" | "attention" | "metier"> = {
  en_retard: "probleme",
  urgent: "attention",
  normal: "metier",
};

/** Rang de l'etape dans la chaine, de 0 pour Recu a 6 pour Livre. */
export function rangStatut(statut: Statut) {
  const rang = STATUTS.indexOf(statut);
  return rang < 0 ? 0 : rang;
}

/*
 * Les tranches d'echeance qui organisent la liste des commandes.
 *
 * Elles remplacent les sept colonnes du Kanban comme axe principal. La
 * chaine des etapes reste lisible - chaque ligne porte ses sept jalons -
 * mais elle ne commande plus la mise en page : un tailleur ouvre cet ecran
 * pour savoir ce qui sort aujourd'hui, pas pour savoir combien de pieces
 * sont a l'etape Couture. La barre de repartition, elle, repond a la
 * seconde question en une ligne.
 */
export type GroupeEcheance =
  | "en_retard"
  | "aujourdhui"
  | "cette_semaine"
  | "plus_tard"
  | "sans_date"
  | "livre";

export const GROUPES_ECHEANCE: readonly GroupeEcheance[] = [
  "en_retard",
  "aujourdhui",
  "cette_semaine",
  "plus_tard",
  "sans_date",
  "livre",
] as const;

export const TON_GROUPE: Record<GroupeEcheance, TonEtiquetteCommande> = {
  en_retard: "probleme",
  aujourdhui: "attention",
  cette_semaine: "metier",
  plus_tard: "neutre",
  sans_date: "neutre",
  livre: "neutre",
};

type TonEtiquetteCommande = "probleme" | "attention" | "metier" | "neutre";

/*
 * « Cette semaine » compte sept jours glissants, et non la semaine
 * calendaire : un vendredi, ce qui interesse le tailleur est ce qui sort
 * d'ici jeudi prochain, pas ce qui sort avant dimanche - deux jours qui ne
 * lui laisseraient presque rien.
 */
export function groupeEcheance(
  dateLivraison: string | null,
  statut: Statut
): GroupeEcheance {
  if (statut === "livre") return "livre";
  if (!dateLivraison) return "sans_date";

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  const livraison = new Date(dateLivraison);
  livraison.setHours(0, 0, 0, 0);

  const jours = Math.round(
    (livraison.getTime() - aujourdhui.getTime()) / 86_400_000
  );

  if (jours < 0) return "en_retard";
  if (jours === 0) return "aujourdhui";
  if (jours <= 7) return "cette_semaine";
  return "plus_tard";
}

/*
 * Un formateur par langue, garde en memoire.
 *
 * Il etait construit a chaque appel, ce qui coute environ cent fois plus
 * que le formatage lui-meme. Sur un Kanban de deux cents commandes, avec
 * le prix et le reste du sur chaque carte, cela faisait quatre cents
 * constructions par rendu - sur le telephone d'entree de gamme qui est la
 * cible du produit. Rendre le formatage dependant de la langue ne devait
 * pas ressusciter ce probleme : la carte n'en garde qu'un par langue.
 */
const NOMBRES = new Map<string, Intl.NumberFormat>();

const LOCALE_PAR_DEFAUT = "fr-FR";

function formateur(locale: string) {
  let trouve = NOMBRES.get(locale);
  if (!trouve) {
    trouve = new Intl.NumberFormat(locale);
    NOMBRES.set(locale, trouve);
  }
  return trouve;
}

/** Le nombre seul, quand la devise est posee a cote en plus petit. */
export function formaterNombre(montant: number, locale = LOCALE_PAR_DEFAUT) {
  return formateur(locale).format(montant);
}

/*
 * La locale est facultative, et c'est volontaire : les ecrans encore en
 * francais continuent d'appeler sans elle pendant que la traduction avance.
 * Un montant a groupement francais sous une interface anglaise se voyait a
 * l'oeil - « 1,396,000 » a cote de « 166 000 » sur le meme ecran - et c'est
 * exactement ce qu'un typage ne peut pas attraper.
 *
 * FCFA ne se traduit pas : c'est le nom de la monnaie, pas un mot.
 */
export function formaterMontant(montant: number, locale = LOCALE_PAR_DEFAUT) {
  return `${formaterNombre(montant, locale)} FCFA`;
}

/*
 * Ce que chaque commande a deja encaisse.
 *
 * Six ecrans refaisaient cette boucle a la main - tableau de bord,
 * finances, Kanban, liste et fiche client, detail de commande - et sept
 * refaisaient la soustraction qui suit. C'est pourtant le seul chiffre du
 * produit qu'un tailleur prononce a voix haute devant son client : le
 * jour ou la regle bouge, en corriger cinq sur six laisse un ecran qui le
 * contredit.
 */
export function versesParCommande(
  paiements: { commande_id: string; montant: number | string }[]
) {
  const total = new Map<string, number>();

  for (const paiement of paiements) {
    total.set(
      paiement.commande_id,
      (total.get(paiement.commande_id) ?? 0) + Number(paiement.montant)
    );
  }

  return total;
}

/** Ce qu'il reste a encaisser. Negatif si le client a trop verse. */
export function resteAPayer(prixTotal: number | string, verse: number) {
  return Number(prixTotal) - verse;
}

/*
 * La ponctualite de l'atelier : la part des pieces sorties a la date
 * promise.
 *
 * C'est le seul indicateur du produit qui juge le travail plutot que
 * l'argent, et le seul qu'un tailleur puisse montrer a un client. Il
 * demande de comparer deux dates que l'application tenait separees : celle
 * qu'on a promise, portee par la commande, et celle ou la piece est
 * reellement sortie, qui ne vit que dans l'historique des statuts.
 *
 * Une commande sans date de livraison prevue est ecartee du calcul : on ne
 * peut pas etre en retard sur une promesse qu'on n'a pas faite. Les
 * compter comme ponctuelles gonflerait le score de tout ce qu'on a oublie
 * de dater.
 */
export type Ponctualite = {
  /** Livraisons sur lesquelles le calcul a pu se faire. */
  mesurees: number;
  aTemps: number;
  /** Pourcentage entier, ou null quand il n'y a rien a mesurer. */
  part: number | null;
  /** Retard moyen en jours, sur les seules pieces en retard. */
  retardMoyen: number;
};

const AUCUNE_PONCTUALITE: Ponctualite = {
  mesurees: 0,
  aTemps: 0,
  part: null,
  retardMoyen: 0,
};

/** Minuit, pour comparer des jours et non des instants. */
function jour(valeur: string) {
  const date = new Date(valeur);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function ponctualite(
  commandes: { id: string; statut: string; date_livraison: string | null }[],
  livraisons: { commande_id: string; created_at: string }[]
): Ponctualite {
  /*
   * La derniere sortie, et non la premiere : le bandeau d'annulation
   * permet de revenir sur un passage a « Livre », ce qui laisse deux
   * lignes dans l'historique. C'est la seconde qui fait foi.
   */
  const sortieReelle = new Map<string, number>();
  for (const ligne of livraisons) {
    const quand = jour(ligne.created_at);
    const connue = sortieReelle.get(ligne.commande_id);
    if (connue === undefined || quand > connue) {
      sortieReelle.set(ligne.commande_id, quand);
    }
  }

  let mesurees = 0;
  let aTemps = 0;
  let joursDeRetard = 0;
  let enRetard = 0;

  for (const commande of commandes) {
    if (commande.statut !== "livre" || !commande.date_livraison) continue;

    const sortie = sortieReelle.get(commande.id);
    if (sortie === undefined) continue;

    mesurees += 1;

    const promise = jour(commande.date_livraison);
    if (sortie <= promise) {
      aTemps += 1;
    } else {
      enRetard += 1;
      joursDeRetard += Math.round((sortie - promise) / 86_400_000);
    }
  }

  if (mesurees === 0) return AUCUNE_PONCTUALITE;

  return {
    mesurees,
    aTemps,
    part: Math.round((aTemps / mesurees) * 100),
    retardMoyen: enRetard > 0 ? joursDeRetard / enRetard : 0,
  };
}

/**
 * Part deja encaissee, en pourcentage.
 *
 * Une commande a prix nul rend zero plutot qu'une division impossible :
 * il n'y a rien a encaisser, donc rien a suivre.
 */
export function partVersee(prixTotal: number | string, verse: number) {
  const prix = Number(prixTotal);
  return prix > 0 ? Math.min(100, (verse / prix) * 100) : 0;
}
