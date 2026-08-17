import {
  ClipboardText,
  House,
  Users,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

/** Partage entre la barre du bas (telephone) et la barre laterale (bureau). */
export const ONGLETS = [
  { href: "/tableau-de-bord", label: "Accueil", icone: House },
  { href: "/commandes", label: "Commandes", icone: ClipboardText },
  { href: "/clients", label: "Clients", icone: Users },
  { href: "/finances", label: "Finances", icone: Wallet },
] as const;

/*
 * Les icones evitent l'imagerie de mercerie - aiguille, ciseaux, bobine -
 * pour la meme raison que le logo l'evite : elle rangerait le produit du
 * cote des fournitures plutot que du cote des outils de gestion. Une
 * commande est une fiche de travail, pas une paire de ciseaux.
 */
