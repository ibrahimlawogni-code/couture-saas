import Link from "next/link";
import { classes } from "./classes";

/*
 * La surface blanche de l'application, en un seul endroit.
 *
 * Elle etait auparavant retapee a la main sur chaque ecran, avec un rayon
 * tantot 2xl tantot 3xl et une ombre parfois oubliee. Le filet vient avant
 * l'ombre : c'est lui qui donne l'arete nette, l'ombre ne fait que poser la
 * carte sur le papier.
 */

type ProprietesCommunes = {
  /** Trace la carte en pointilles : contenu pas encore parti au serveur. */
  provisoire?: boolean;
  classe?: string;
  children: React.ReactNode;
};

const BASE = "rounded-carte bg-white";
const POSEE = "border border-bordure shadow-carte";
const PROVISOIRE = "border border-dashed border-bordure";

export function Carte({
  provisoire = false,
  classe,
  children,
}: ProprietesCommunes) {
  return (
    <div className={classes(BASE, provisoire ? PROVISOIRE : POSEE, classe)}>
      {children}
    </div>
  );
}

/**
 * Carte cliquable. Le retour tactile passe par le fond plutot que par une
 * ombre : sur un telephone d'entree de gamme, recalculer une ombre a chaque
 * appui se voit.
 */
export function CarteLien({
  href,
  provisoire = false,
  classe,
  children,
}: ProprietesCommunes & { href: string }) {
  return (
    <Link
      href={href}
      className={classes(
        BASE,
        provisoire ? PROVISOIRE : POSEE,
        "block transition-colors duration-150 ease-doux",
        "hover:border-vert-clair hover:bg-papier active:bg-vert-clair/40",
        classe
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Surface sombre des en-tetes d'accueil. Isolee ici pour que l'anneau de
 * focus blanc defini dans globals.css suive automatiquement.
 */
export function Panneau({ classe, children }: Omit<ProprietesCommunes, "provisoire">) {
  return (
    <section
      className={classes(
        "sur-fond-sombre rounded-panneau bg-foret text-white",
        classe
      )}
    >
      {children}
    </section>
  );
}
