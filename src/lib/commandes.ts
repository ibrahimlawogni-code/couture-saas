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
  recu: "Recu",
  coupe: "Coupe",
  couture: "Couture",
  essayage: "Essayage",
  finitions: "Finitions",
  pret: "Pret a retirer",
  livre: "Livre",
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

export const PRIORITE_STYLES: Record<Priorite, string> = {
  en_retard: "bg-red-100 text-red-700",
  urgent: "bg-amber-100 text-amber-800",
  normal: "bg-zinc-100 text-zinc-600",
};

export const PRIORITE_LABELS: Record<Priorite, string> = {
  en_retard: "En retard",
  urgent: "A livrer bientot",
  normal: "Dans les temps",
};

export function formaterMontant(montant: number) {
  return `${new Intl.NumberFormat("fr-FR").format(montant)} FCFA`;
}
