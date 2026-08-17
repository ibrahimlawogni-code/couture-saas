import type { Icon } from "@phosphor-icons/react";
import { classes } from "./classes";

/*
 * Ce qu'on voit quand il n'y a rien.
 *
 * L'application repondait par une ligne de gris centree : « Aucun client
 * pour l'instant. » C'est exact et parfaitement inutile. Un ecran vide est
 * le premier qu'un nouvel atelier rencontre, et souvent le seul pendant sa
 * premiere semaine : c'est le moment ou il faut dire a quoi sert l'ecran
 * et par ou commencer.
 *
 * Deux cas a ne pas confondre, d'ou la prop `recherche` : un ecran vide
 * parce que rien n'a encore ete cree appelle une invitation a creer, un
 * ecran vide parce qu'une recherche n'a rien donne appelle au contraire
 * un moyen de revenir en arriere.
 */

export function EtatVide({
  icone: Icone,
  titre,
  texte,
  action,
  classe,
}: {
  icone: Icon;
  titre: string;
  texte?: string;
  action?: React.ReactNode;
  classe?: string;
}) {
  return (
    <div
      className={classes(
        "flex flex-col items-center rounded-carte border border-dashed border-bordure",
        "px-6 py-12 text-center",
        classe
      )}
    >
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-full bg-vert-clair text-foret"
      >
        <Icone size={24} weight="duotone" />
      </span>

      <p className="mt-4 text-base font-semibold text-encre">{titre}</p>
      {texte && <p className="mt-1.5 max-w-xs text-sm text-gris">{texte}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
