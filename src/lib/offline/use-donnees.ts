"use client";

import { useSyncExternalStore } from "react";
import {
  lireDonnees,
  lireDonneesServeur,
  souscrireDonnees,
  type Donnees,
} from "./donnees-store";

/** Donnees de l'atelier lues dans la copie locale, disponibles hors reseau. */
export function useDonnees(): Donnees {
  return useSyncExternalStore(souscrireDonnees, lireDonnees, lireDonneesServeur);
}
