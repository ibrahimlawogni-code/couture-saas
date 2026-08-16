import { classes } from "./classes";

/*
 * Ce qui s'affiche pendant que la copie locale s'ouvre.
 *
 * L'application posait « Chargement... » en gris au milieu de la page,
 * puis remplacait ce texte par l'ecran complet. Le saut etait brutal, et
 * la phrase n'apprenait rien : elle ne disait ni combien de temps, ni ce
 * qui allait apparaitre. Une silhouette de la meme forme que le contenu
 * attendu tient la place, et l'arrivee des donnees ne deplace plus rien.
 *
 * L'animation s'arrete d'elle-meme si le systeme demande moins de
 * mouvement : la regle est posee pour tout le document dans globals.css.
 */

export function Squelette({ classe }: { classe?: string }) {
  return (
    <div
      className={classes("animate-pulse rounded-controle bg-bordure", classe)}
    />
  );
}

/** Silhouette d'une ligne de liste : un nom, une precision, une pastille. */
export function SqueletteLigne() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-carte border border-bordure bg-white px-4 py-3.5">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Squelette classe="h-3.5 w-2/5" />
        <Squelette classe="h-3 w-3/5" />
      </div>
      <Squelette classe="h-6 w-16 rounded-full" />
    </div>
  );
}

/**
 * Silhouette d'un ecran de liste. Le nombre de lignes est volontairement
 * modeste : en afficher dix laisserait croire a un contenu abondant que la
 * plupart des ateliers n'ont pas encore.
 */
export function SqueletteListe({ lignes = 4 }: { lignes?: number }) {
  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      className="flex flex-col gap-2"
    >
      {Array.from({ length: lignes }, (_, index) => (
        <SqueletteLigne key={index} />
      ))}
    </div>
  );
}

/** Silhouette d'une vignette de statistique. */
export function SqueletteVignette() {
  return (
    <div className="flex flex-col gap-2.5 rounded-carte border border-bordure bg-white p-4">
      <Squelette classe="h-3 w-3/5" />
      <Squelette classe="h-6 w-4/5" />
    </div>
  );
}
