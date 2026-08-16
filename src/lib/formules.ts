/**
 * Plafonds des formules, pour l'affichage seulement.
 *
 * La base est seule a decider : ce sont ses declencheurs qui refusent une
 * ecriture, et ils lisent la table formules. Ces valeurs ne servent qu'a
 * annoncer ce qui reste avant d'atteindre la limite, plutot que de laisser
 * quelqu'un remplir un formulaire pour se le voir refuser a l'envoi.
 */
export type Plafonds = {
  nom: string;
  /** null vaut illimite */
  clients: number | null;
  commandesEnCours: number | null;
};

const FORMULES: Record<string, Plafonds> = {
  decouverte: { nom: "Découverte", clients: 5, commandesEnCours: 5 },
  atelier: { nom: "Atelier", clients: null, commandesEnCours: null },
  atelier_pro: { nom: "Atelier Pro", clients: null, commandesEnCours: null },
};

// Une formule inconnue de cette table ne doit rien bloquer : la base
// tranchera, et mieux vaut laisser passer que barrer la route a tort.
const INCONNUE: Plafonds = { nom: "", clients: null, commandesEnCours: null };

export function plafonds(formule: string | undefined | null): Plafonds {
  return FORMULES[formule ?? ""] ?? INCONNUE;
}
