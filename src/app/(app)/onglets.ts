import {
  ClipboardText,
  House,
  Users,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Partage entre la barre du bas (telephone) et la barre laterale (bureau).
 *
 * Les entrees portent une cle et non un libelle : le mot depend de la
 * langue de l'atelier, et cette liste est lue par deux composants qui ne
 * peuvent pas la traduire chacun de leur cote sans diverger.
 */
export const ONGLETS = [
  { href: "/tableau-de-bord", cle: "accueil", icone: House },
  { href: "/commandes", cle: "commandes", icone: ClipboardText },
  { href: "/clients", cle: "clients", icone: Users },
  { href: "/finances", cle: "finances", icone: Wallet },
] as const;

/*
 * Les icones evitent l'imagerie de mercerie - aiguille, ciseaux, bobine -
 * pour la meme raison que le logo l'evite : elle rangerait le produit du
 * cote des fournitures plutot que du cote des outils de gestion. Une
 * commande est une fiche de travail, pas une paire de ciseaux.
 */
