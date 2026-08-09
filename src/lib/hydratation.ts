"use client";

import { useSyncExternalStore } from "react";

const sansAbonnement = () => () => {};

/**
 * Vrai une fois que le navigateur a pris la main sur la page.
 *
 * Tant que ce n'est pas le cas, un formulaire se comporte comme un formulaire
 * HTML brut : la saisie part dans l'adresse et n'est jamais enregistree. Sur
 * un telephone modeste, ce delai dure assez longtemps pour qu'un utilisateur
 * presse appuie avant l'heure et perde son travail sans le savoir.
 */
export function useHydratation() {
  return useSyncExternalStore(
    sansAbonnement,
    () => true,
    () => false
  );
}
