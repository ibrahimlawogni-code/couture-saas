"use client";

import { useSyncExternalStore } from "react";
import { lireEtat, lireEtatServeur, souscrire } from "./store";

export function useFileAttente() {
  const etat = useSyncExternalStore(souscrire, lireEtat, lireEtatServeur);

  return {
    horsLigne: etat.horsLigne,
    enAttente: etat.operations.filter((operation) => !operation.echec),
    echecs: etat.operations.filter((operation) => operation.echec),
  };
}
