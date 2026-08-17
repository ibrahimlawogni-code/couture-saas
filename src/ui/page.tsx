import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { classes } from "./classes";

/*
 * Le cadre commun a tous les ecrans.
 *
 * Trois largeurs, et la raison de chacune :
 *
 *   etroit  listes et formulaires. Une ligne de texte trop large se lit
 *           mal, quelle que soit la place disponible.
 *   large   tableaux de chiffres. Eux gagnent a s'etaler : la contrainte
 *           de lisibilite d'une ligne de prose ne les concerne pas.
 *   pleine  le Kanban, dont les colonnes doivent filer jusqu'aux bords de
 *           l'ecran sans quoi le defilement parait bute.
 */

const LARGEURS = {
  etroit: "mx-auto w-full max-w-2xl px-4",
  large: "mx-auto w-full max-w-2xl px-4 lg:max-w-5xl lg:px-8",
  pleine: "w-full",
} as const;

export function Page({
  largeur = "etroit",
  classe,
  children,
}: {
  largeur?: keyof typeof LARGEURS;
  classe?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={classes("flex flex-1 flex-col py-6", LARGEURS[largeur], classe)}>
      {children}
    </div>
  );
}

/**
 * Retour vers l'ecran parent.
 *
 * C'etait une fleche et un mot en gris de treize pixels, soit une cible
 * d'une quinzaine de pixels de haut : sous la taille en dessous de
 * laquelle un doigt rate sa cible une fois sur trois. Le decalage negatif
 * elargit la zone sensible sans deplacer le texte a l'ecran.
 */
export function LienRetour({ href, children = "Retour" }: { href: string; children?: string }) {
  return (
    <Link
      href={href}
      className="-mx-2 -my-1 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-controle px-2 py-1 text-sm text-gris transition-colors duration-150 ease-doux hover:bg-white hover:text-encre"
    >
      <ArrowLeft size={15} />
      {children}
    </Link>
  );
}

/**
 * Titre d'ecran et action principale.
 *
 * L'action reste sur la meme ligne que le titre tant qu'elle tient, et
 * passe dessous sinon : sur un petit telephone, « + Nouvelle commande »
 * ecrasait le titre jusqu'a le tronquer.
 */
export function EnTetePage({
  titre,
  precision,
  action,
}: {
  titre: string;
  precision?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-encre">{titre}</h1>
        {precision && <div className="mt-1 text-sm text-gris">{precision}</div>}
      </div>
      {action}
    </div>
  );
}

/**
 * Intertitre de section a l'interieur d'un ecran. Le compteur se pose a
 * droite, aligne sur la ligne de base du titre.
 */
export function EnTeteSection({
  titre,
  action,
  classe,
}: {
  titre: string;
  action?: React.ReactNode;
  classe?: string;
}) {
  return (
    <div className={classes("flex items-center justify-between gap-3", classe)}>
      <h2 className="text-sm font-semibold tracking-wide text-gris uppercase">
        {titre}
      </h2>
      {action}
    </div>
  );
}
