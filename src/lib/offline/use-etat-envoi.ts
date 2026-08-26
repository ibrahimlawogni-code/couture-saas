"use client";

import { useEffect, useState } from "react";
import { EVENEMENT_MIROIR } from "./miroir";
import { useFileAttente } from "./use-file-attente";

export type TonEnvoi = "calme" | "systeme" | "probleme";

export type EtatEnvoi = {
  ton: TonEnvoi;
  texte: string;
  /** Complement de droite : l'heure, ou ce qui reste a partir. */
  detail: string | null;
  echecs: number;
};

/*
 * L'etat d'envoi, dit d'une seule voix.
 *
 * Deux endroits l'affichent maintenant en permanence - la bande sous
 * l'en-tete du telephone, le bas de la barre laterale sur grand ecran - et
 * deux endroits qui calculent separement la meme chose finissent toujours
 * par se contredire un jour, sur le cas qu'un seul des deux a prevu.
 */
export function useEtatEnvoi(): EtatEnvoi {
  const { horsLigne, enAttente, echecs } = useFileAttente();
  const [heure, setHeure] = useState<string | null>(null);

  /*
   * L'heure affichee est celle de la derniere lecture reussie du serveur,
   * pas celle de l'horloge. Inventer « À jour · maintenant » a chaque rendu
   * dirait le contraire de ce que la mention promet.
   */
  useEffect(() => {
    function noter() {
      setHeure(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }

    window.addEventListener(EVENEMENT_MIROIR, noter);
    return () => window.removeEventListener(EVENEMENT_MIROIR, noter);
  }, []);

  if (echecs.length > 0) {
    const pluriel = echecs.length > 1 ? "s" : "";
    return {
      ton: "probleme",
      texte: `${echecs.length} enregistrement${pluriel} refusé${pluriel}`,
      detail: null,
      echecs: echecs.length,
    };
  }

  if (horsLigne) {
    const pluriel = enAttente.length > 1 ? "s" : "";
    return {
      ton: "systeme",
      texte: "Hors connexion",
      detail:
        enAttente.length > 0
          ? `${enAttente.length} fiche${pluriel} sur l'appareil`
          : null,
      echecs: 0,
    };
  }

  if (enAttente.length > 0) {
    return {
      ton: "systeme",
      texte: "Envoi en cours",
      detail: `${enAttente.length} restant${enAttente.length > 1 ? "s" : ""}`,
      echecs: 0,
    };
  }

  return { ton: "calme", texte: "À jour", detail: heure, echecs: 0 };
}
