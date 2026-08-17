import Link from "next/link";
import { classes } from "./classes";

/*
 * Quatre allures, une seule definition.
 *
 * La hauteur minimale de 44 px n'est pas decorative : c'est la cible
 * tactile en dessous de laquelle un doigt rate le bouton une fois sur
 * trois. L'application visait cette taille par du remplissage, ce qui la
 * faisait varier d'un ecran a l'autre selon la taille du texte.
 */

export type AllureBouton =
  | "principal"
  | "secondaire"
  | "discret"
  | "attention"
  | "danger";
export type TailleBouton = "normal" | "compact";

const ALLURES: Record<AllureBouton, string> = {
  principal: "bg-foret text-white hover:bg-vert active:bg-vert",
  secondaire:
    "border border-bordure bg-white text-encre hover:border-vert-clair hover:bg-papier active:bg-vert-clair/40",
  discret: "text-gris hover:bg-papier hover:text-encre active:bg-bordure",
  // Une limite d'offre atteinte : l'action reste offerte, mais elle mene
  // vers les tarifs plutot que vers le formulaire.
  attention: "bg-ambre-clair text-ambre hover:bg-ambre hover:text-white",
  danger: "bg-rouge-clair text-rouge hover:bg-rouge hover:text-white",
};

const TAILLES: Record<TailleBouton, string> = {
  normal: "min-h-11 px-5 text-sm",
  compact: "min-h-9 px-3 text-xs",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-controle font-medium " +
  "transition-colors duration-150 ease-doux " +
  "disabled:pointer-events-none disabled:opacity-50";

export function styleBouton(
  allure: AllureBouton = "principal",
  taille: TailleBouton = "normal",
  pleineLargeur = false
) {
  return classes(BASE, ALLURES[allure], TAILLES[taille], pleineLargeur && "w-full");
}

type Communes = {
  allure?: AllureBouton;
  taille?: TailleBouton;
  pleineLargeur?: boolean;
  classe?: string;
  children: React.ReactNode;
};

export function Bouton({
  allure,
  taille,
  pleineLargeur,
  classe,
  ...reste
}: Communes & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...reste}
      className={classes(styleBouton(allure, taille, pleineLargeur), classe)}
    />
  );
}

export function LienBouton({
  href,
  allure,
  taille,
  pleineLargeur,
  classe,
  children,
}: Communes & { href: string }) {
  return (
    <Link
      href={href}
      className={classes(styleBouton(allure, taille, pleineLargeur), classe)}
    >
      {children}
    </Link>
  );
}
