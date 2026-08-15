"use client";

import { usePathname } from "next/navigation";
import { useHydratation } from "./hydratation";

/**
 * Dernier segment de l'adresse affichee.
 *
 * Deux pieges se cumulent ici. Hors connexion, le service worker sert une
 * page mise en cache sous un modele d'adresse : les parametres fournis par
 * le rendu serveur portent alors l'identifiant d'une autre fiche. Et apres
 * une navigation interne, window.location n'est pas encore a jour au
 * moment du rendu : on lisait donc "new" juste apres une creation, et la
 * fiche se declarait introuvable.
 *
 * usePathname repond aux deux : il vient de l'etat du routeur, donc de
 * l'adresse reellement demandee, et il provoque un rendu a chaque
 * changement d'adresse.
 */
export function useIdentifiantUrl(): string | null {
  const pret = useHydratation();
  const chemin = usePathname();

  if (!pret) return null;

  const segments = chemin.split("/").filter(Boolean);
  return segments.at(-1) ?? null;
}
