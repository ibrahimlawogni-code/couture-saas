"use client";

import { useState } from "react";
import { formaterMontant } from "@/lib/commandes";
import type { Traductions } from "@/lib/i18n";

export type PointMensuel = { mois: string; libelle: string; montant: number };

/**
 * Barres construites en CSS plutot qu'en SVG : plus leger a l'affichage sur
 * un telephone d'entree de gamme, et plus simple a rendre accessible.
 *
 * Une seule teinte pour toutes les barres. Distinguer le mois en cours par
 * un vert plus fonce a ete ecarte : les deux verts de la marque se
 * separent de 14,9 en ecart percu, sous le seuil de 15 en dessous duquel
 * une vision normale ne les distingue plus. Le mois en cours est donc
 * signale par son libelle en gras, pas par sa couleur.
 *
 * Une seule serie, donc pas de legende : le titre de la carte dit deja ce
 * qui est mesure, et un cartouche a une seule pastille ne ferait que le
 * repeter.
 */
export function GraphiqueEncaissements({
  points,
  mots,
  ton = "clair",
}: {
  points: PointMensuel[];
  mots: Traductions;
  /**
   * « sombre » quand le graphique est pose sur le panneau vert foret. Le
   * vert des barres y tomberait a un ecart insuffisant du fond : il faut
   * la teinte claire de la meme famille, qui donne 6,5:1.
   */
  ton?: "clair" | "sombre";
}) {
  const [survole, setSurvole] = useState<number | null>(null);

  const maximum = Math.max(...points.map((p) => p.montant), 1);
  const total = points.reduce((somme, p) => somme + p.montant, 0);
  const indexMax = points.findIndex((p) => p.montant === maximum);
  const dernier = points.length - 1;

  const sombre = ton === "sombre";
  const barre = sombre ? "bg-vert-pale" : "bg-vert";
  const secondaire = sombre ? "text-vert-pale" : "text-gris";
  const principal = sombre ? "text-white" : "text-encre";
  const filet = sombre ? "border-white/20" : "border-bordure";

  if (total === 0) {
    return (
      <p className={`mt-4 text-sm ${secondaire}`}>
        Aucun encaissement enregistré sur les six derniers mois.
      </p>
    );
  }

  // Le mois en cours par defaut : la ligne de lecture ne reste jamais vide,
  // et elle porte deja une information au premier coup d'oeil.
  const lu = survole ?? dernier;

  return (
    <div>
      <div
        className={`flex h-20 items-end gap-1.5 border-b ${filet}`}
        onPointerLeave={() => setSurvole(null)}
      >
        {points.map((point, index) => {
          const hauteur = Math.max(2, (point.montant / maximum) * 100);
          // Valeur affichee sur le plus haut et sur le mois en cours
          // seulement : une etiquette sur chaque barre encombre pour rien.
          const etiquette = index === indexMax || index === dernier;

          return (
            <button
              key={point.mois}
              type="button"
              onPointerEnter={() => setSurvole(index)}
              onFocus={() => setSurvole(index)}
              onBlur={() => setSurvole(null)}
              onClick={() => setSurvole(index)}
              // La zone sensible occupe toute la bande, barre courte
              // comprise : viser une barre de deux pixels de haut serait
              // impossible au doigt.
              className="flex h-full flex-1 cursor-pointer flex-col justify-end gap-1"
              aria-label={`${point.libelle} : ${formaterMontant(point.montant, mots.locale)}`}
            >
              {(etiquette || lu === index) && (
                <span
                  className={`chiffres text-[10px] leading-none font-medium ${secondaire}`}
                >
                  {Math.round(point.montant / 1000)}k
                </span>
              )}
              {/*
               * Largeur plafonnee a 24 px et barre centree dans sa bande :
               * une barre qui remplit toute sa bande transforme le
               * graphique en aplat et supprime l'air qui le rend lisible.
               * Coin superieur arrondi, pied carre : la barre doit se poser
               * franchement sur sa ligne de base.
               */}
              <span
                style={{ height: `${hauteur}%` }}
                className={`mx-auto w-full max-w-6 rounded-t-[4px] transition-opacity duration-150 ease-doux ${barre} ${
                  survole !== null && survole !== index ? "opacity-35" : ""
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex gap-1.5">
        {points.map((point, index) => (
          <span
            key={point.mois}
            className={`flex-1 text-center text-[10px] ${
              index === lu ? `font-semibold ${principal}` : secondaire
            }`}
          >
            {point.libelle}
          </span>
        ))}
      </div>

      {/*
       * La valeur se lit sous le graphique et non dans une bulle posee sur
       * la barre. Sur un telephone tenu a une main, le doigt couvre
       * precisement l'endroit ou la bulle s'afficherait ; et aux deux
       * extremites, une bulle centree sur la barre deborderait du panneau.
       *
       * Rien tant qu'aucune barre n'est designee : le chiffre d'accroche,
       * juste au-dessus, donne deja le mois en cours. Afficher la meme
       * valeur deux fois a dix pixels d'ecart ne renseigne personne.
       *
       * La hauteur est reservee en permanence pour que l'apparition de la
       * ligne ne pousse pas les boutons vers le bas sous le doigt.
       */}
      <p className={`mt-2 min-h-4 text-xs ${secondaire}`}>
        {survole !== null && (
          <>
            <span className={`font-semibold ${principal}`}>
              {points[survole].libelle}
            </span>{" "}
            <span className="chiffres">{formaterMontant(points[survole].montant, mots.locale)}</span>
          </>
        )}
      </p>
    </div>
  );
}
