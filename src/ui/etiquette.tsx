import { classes } from "./classes";

/*
 * La grammaire de couleur de la marque, rendue impossible a enfreindre.
 *
 * Les teintes etaient jusqu'ici recopiees a la main sur chaque pastille,
 * ce qui avait deja produit un ecart : le compteur de colonne du Kanban
 * posait du gris sur du vert clair, soit 3,71:1, sous le seuil AA. En
 * nommant les tons par ce qu'ils veulent dire plutot que par leur couleur,
 * le mauvais accord ne peut plus s'ecrire.
 *
 *   metier    le travail du tailleur, son avancement, ses echeances tenues
 *   attention une echeance qui approche, une limite d'offre proche
 *   probleme  un retard, un refus, une erreur
 *   systeme   l'application qui parle d'elle-meme : envoi, synchronisation
 *   neutre    une information sans charge
 */

export type TonEtiquette =
  | "metier"
  | "attention"
  | "probleme"
  | "systeme"
  | "neutre";

const TONS: Record<TonEtiquette, string> = {
  metier: "bg-vert-clair text-foret",
  attention: "bg-ambre-clair text-ambre",
  probleme: "bg-rouge-clair text-rouge",
  systeme: "bg-bleu-clair text-bleu",
  neutre: "bg-papier text-gris",
};

export function Etiquette({
  ton = "neutre",
  classe,
  children,
}: {
  ton?: TonEtiquette;
  classe?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={classes(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1",
        "text-xs font-medium whitespace-nowrap",
        TONS[ton],
        classe
      )}
    >
      {children}
    </span>
  );
}

/**
 * Pastille de comptage, dans les en-tetes de colonne et d'onglet. Chasse
 * fixe pour que deux colonnes voisines alignent leurs chiffres.
 */
export function Compteur({
  ton = "neutre",
  children,
}: {
  ton?: TonEtiquette;
  children: React.ReactNode;
}) {
  return (
    <span
      className={classes(
        "chiffres inline-flex min-w-6 items-center justify-center rounded-full",
        "px-1.5 py-0.5 text-xs font-semibold",
        TONS[ton]
      )}
    >
      {children}
    </span>
  );
}
