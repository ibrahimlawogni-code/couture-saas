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

export function formaterMontant(montant: number) {
  return `${new Intl.NumberFormat("fr-FR").format(montant)} FCFA`;
}
