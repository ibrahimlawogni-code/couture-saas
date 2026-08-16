"use client";

import { useState } from "react";
import { formaterMontant } from "@/lib/commandes";

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
export function GraphiqueEncaissements({ points }: { points: PointMensuel[] }) {
  const [survole, setSurvole] = useState<number | null>(null);

  const maximum = Math.max(...points.map((p) => p.montant), 1);
  const total = points.reduce((somme, p) => somme + p.montant, 0);
  const indexMax = points.findIndex((p) => p.montant === maximum);
  const dernier = points.length - 1;

  if (total === 0) {
    return (
      <p className="mt-5 text-sm text-gris">
        Aucun encaissement enregistré sur les six derniers mois.
      </p>
    );
  }

  // Le mois en cours par defaut : la ligne de lecture ne reste jamais vide,
  // et elle porte deja une information au premier coup d'oeil.
  const lu = survole ?? dernier;

  return (
    <div className="mt-4">
      {/*
       * La valeur se lit sous le graphique et non dans une bulle posee sur
       * la barre. Sur un telephone tenu a une main, le doigt couvre
       * precisement l'endroit ou la bulle s'afficherait ; et aux deux
       * extremites, une bulle centree sur la barre deborderait de la carte.
       */}
      <p className="flex items-baseline gap-2 text-sm">
        <span className="font-semibold text-encre">{points[lu].libelle}</span>
        <span className="text-gris">{formaterMontant(points[lu].montant)}</span>
      </p>

      <div
        className="mt-3 flex h-32 items-end gap-1.5 border-b border-bordure"
        onPointerLeave={() => setSurvole(null)}
      >
        {points.map((point, index) => {
          const hauteur = Math.max(2, (point.montant / maximum) * 100);
          // Valeur affichee sur le plus haut et sur le mois en cours
          // seulement : une etiquette sur chaque barre encombre pour rien.
          const etiquette = index === indexMax || index === dernier;
          const actif = lu === index;

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
              aria-label={`${point.libelle} : ${formaterMontant(point.montant)}`}
            >
              {(etiquette || actif) && (
                <span className="chiffres text-[10px] leading-none font-medium text-gris">
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
                className={`mx-auto w-full max-w-6 rounded-t-[4px] bg-vert transition-opacity duration-150 ease-doux ${
                  survole !== null && survole !== index ? "opacity-35" : ""
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex gap-1.5">
        {points.map((point, index) => (
          <span
            key={point.mois}
            className={`flex-1 text-center text-[11px] ${
              index === dernier ? "font-semibold text-encre" : "text-gris"
            }`}
          >
            {point.libelle}
          </span>
        ))}
      </div>
    </div>
  );
}
