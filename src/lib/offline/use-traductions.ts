"use client";

import { traduire } from "@/lib/i18n";
import { useDonnees } from "./use-donnees";

/**
 * Les mots de l'application, dans la langue de l'atelier.
 *
 * Lus dans la copie locale et non sur le serveur : les ecrans ne lisent
 * qu'elle, et une application qui repasserait en francais des que le reseau
 * coupe serait deroutante - d'autant que c'est justement hors ligne qu'on
 * s'en sert le plus.
 *
 * Avant le premier chargement du miroir, l'atelier est absent et traduire()
 * rend le francais. C'est le comportement d'aujourd'hui, donc aucun atelier
 * ne voit de changement tant qu'il n'a pas choisi l'anglais.
 */
export function useTraductions() {
  const { atelier } = useDonnees();
  return traduire(atelier?.langue);
}
