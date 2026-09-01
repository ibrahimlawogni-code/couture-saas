"use client";

import type { Traductions } from "@/lib/i18n";
import { METHODES, type Methode } from "@/lib/paiements";
import { classes } from "./classes";

/**
 * Le moyen de paiement, en trois cases cote a cote.
 *
 * Une liste deroulante demanderait deux gestes - ouvrir, choisir - la ou
 * trois choix tiennent sur une ligne et s'atteignent d'une seule touche.
 * Le tailleur encaisse debout, souvent d'une main, parfois en tendant le
 * vetement de l'autre.
 *
 * Des boutons radio plutot que des boutons ordinaires : le groupement, la
 * navigation aux fleches et l'annonce « 2 sur 3 » viennent alors du
 * navigateur, sans avoir a les reconstruire.
 */
export function ChoixMethode({
  mots,
  nom,
  valeur,
  onChange,
  libelle,
  classe,
}: {
  /* Les mots arrivent en props : une primitive de src/ui ne lit ni la
     session ni le miroir. C'est l'ecran qui sait dans quelle langue il
     parle. */
  mots: Traductions;
  nom: string;
  valeur: Methode;
  onChange: (methode: Methode) => void;
  /** Par defaut « Reçu en », dans la langue de l'atelier. */
  libelle?: string;
  classe?: string;
}) {
  return (
    <fieldset className={classes("min-w-0", classe)}>
      <legend className="mb-1.5 text-sm font-medium text-encre">
        {libelle ?? mots.recuEn}
      </legend>

      <div className="flex gap-1.5">
        {METHODES.map((methode) => {
          const choisi = valeur === methode;

          return (
            <label
              key={methode}
              className={classes(
                "flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-controle border px-2 text-center text-xs font-medium transition-colors duration-150 ease-doux",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vert",
                choisi
                  ? "border-vert bg-vert-clair text-foret"
                  : "border-bordure bg-white text-gris hover:border-vert-pale"
              )}
            >
              <input
                type="radio"
                name={nom}
                value={methode}
                checked={choisi}
                onChange={() => onChange(methode)}
                className="sr-only"
              />
              {mots.methodes[methode]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
