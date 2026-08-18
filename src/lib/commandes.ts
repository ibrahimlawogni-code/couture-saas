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

export const STATUT_LABELS: Record<Statut, string> = {
  recu: "Reçu",
  coupe: "Coupe",
  couture: "Couture",
  essayage: "Essayage",
  finitions: "Finitions",
  pret: "Prêt à retirer",
  livre: "Livré",
};

export function statutSuivant(statut: Statut): Statut | null {
  const index = STATUTS.indexOf(statut);
  return index >= 0 && index < STATUTS.length - 1 ? STATUTS[index + 1] : null;
}

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

export const PRIORITE_LABELS: Record<Priorite, string> = {
  en_retard: "En retard",
  urgent: "À livrer bientôt",
  normal: "Dans les temps",
};

/*
 * Un seul formateur pour toute l'application.
 *
 * Il etait construit a chaque appel, ce qui coute environ cent fois plus
 * que le formatage lui-meme. Sur un Kanban de deux cents commandes, avec
 * le prix et le reste du sur chaque carte, cela faisait quatre cents
 * constructions par rendu - sur le telephone d'entree de gamme qui est la
 * cible du produit.
 */
const NOMBRE = new Intl.NumberFormat("fr-FR");

/** Le nombre seul, quand la devise est posee a cote en plus petit. */
export function formaterNombre(montant: number) {
  return NOMBRE.format(montant);
}

export function formaterMontant(montant: number) {
  return `${formaterNombre(montant)} FCFA`;
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
