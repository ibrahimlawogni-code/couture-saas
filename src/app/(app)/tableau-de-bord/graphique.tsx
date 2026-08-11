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
 */
export function GraphiqueEncaissements({ points }: { points: PointMensuel[] }) {
  const [actif, setActif] = useState<number | null>(null);

  const maximum = Math.max(...points.map((p) => p.montant), 1);
  const total = points.reduce((somme, p) => somme + p.montant, 0);
  const indexMax = points.findIndex((p) => p.montant === maximum);
  const dernier = points.length - 1;

  if (total === 0) {
    return (
      <p className="mt-6 text-sm text-gris">
        Aucun encaissement enregistré sur les six derniers mois.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <div className="flex h-36 items-end gap-1.5">
        {points.map((point, index) => {
          const hauteur = Math.max(2, (point.montant / maximum) * 100);
          // Valeur affichee sur le plus haut et sur le mois en cours
          // seulement : une etiquette sur chaque barre encombre pour rien.
          const etiquette = index === indexMax || index === dernier;

          return (
            <button
              key={point.mois}
              type="button"
              onClick={() => setActif(actif === index ? null : index)}
              className="flex h-full flex-1 cursor-pointer flex-col justify-end gap-1 rounded-t-md"
              aria-label={`${point.libelle} : ${formaterMontant(point.montant)}`}
            >
              {(etiquette || actif === index) && (
                <span className="text-[10px] font-medium tabular-nums text-gris">
                  {Math.round(point.montant / 1000)}k
                </span>
              )}
              <span
                style={{ height: `${hauteur}%` }}
                className={`w-full rounded-t-md bg-vert transition-opacity ${
                  actif !== null && actif !== index ? "opacity-40" : ""
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

      {actif !== null && (
        <p className="mt-3 text-sm text-encre">
          <span className="font-medium">{points[actif].libelle}</span>{" "}
          <span className="text-gris">·</span>{" "}
          {formaterMontant(points[actif].montant)}
        </p>
      )}
    </div>
  );
}
