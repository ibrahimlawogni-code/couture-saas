"use client";

import { useHydratation } from "./hydratation";

/**
 * Dernier segment de l'adresse, lu directement dans le navigateur.
 *
 * Hors connexion, le service worker sert une page mise en cache sous un
 * modele d'adresse : les donnees de navigation fournies par Next portent
 * alors l'identifiant d'une autre fiche. Lire l'adresse reelle garantit
 * d'afficher la bonne.
 */
export function useIdentifiantUrl(): string | null {
  const pret = useHydratation();
  if (!pret) return null;

  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments.at(-1) ?? null;
}
