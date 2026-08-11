"use client";

import { useEffect } from "react";
import { useDonnees } from "@/lib/offline/use-donnees";

const ECRANS_FIXES = [
  "/commandes",
  "/clients",
  "/finances",
  "/clients/new",
  "/commandes/new",
  "/reglages",
];

// Une seule preparation par session : inutile de refaire ces requetes a
// chaque changement d'ecran.
let dejaPrepare = false;

/**
 * Next.js ne recharge pas la page quand on navigue dans l'application : il ne
 * demande que les donnees. Le HTML des ecrans atteints par la navigation
 * interne n'est donc jamais telecharge, et manquerait hors connexion.
 *
 * Ces requetes traversent le service worker, qui les met en cache au passage.
 * Une seule page de detail suffit : le service worker la range sous son modele
 * d'adresse, ce qui rend consultables toutes les fiches du meme type.
 */
export function Prechargement() {
  const { clients, commandes, chargee } = useDonnees();

  const premierClient = clients[0]?.id;
  const premiereCommande = commandes[0]?.id;

  useEffect(() => {
    if (dejaPrepare || !chargee || !navigator.onLine) return;
    dejaPrepare = true;

    const adresses = [...ECRANS_FIXES];

    if (premierClient) {
      adresses.push(`/clients/${premierClient}`);
      adresses.push(`/clients/${premierClient}/mesures/new`);
    }
    if (premiereCommande) {
      adresses.push(`/commandes/${premiereCommande}`);
    }

    for (const adresse of adresses) {
      fetch(adresse, { credentials: "same-origin" }).catch(() => {
        // Une page qui ne se precharge pas ne doit rien casser.
      });
    }
  }, [chargee, premierClient, premiereCommande]);

  return null;
}
