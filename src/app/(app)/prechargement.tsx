"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDonnees } from "@/lib/offline/use-donnees";

const ECRANS_FIXES = [
  "/tableau-de-bord",
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
 *
 * Rapporter le HTML ne suffit pas, et le defaut ne se voyait qu'une fois
 * le reseau coupe : la page sortait du cache et s'affichait normalement,
 * mais ses balises script pointaient vers des fichiers que personne
 * n'avait jamais demandes, donc que le service worker n'avait jamais vus
 * passer. React n'hydratait pas. Le formulaire « Nouveau client » restait
 * fige sur « Chargement... » et « Nouvelle commande » ne s'ouvrait pas du
 * tout - la promesse meme du produit, prendre une commande sans reseau,
 * tombait.
 *
 * Les bundles sont donc lus dans le HTML rapporte, puis demandes un a un.
 * router.prefetch a d'abord ete essaye : il rapporte la charge RSC, ce qui
 * sert a la navigation interne, mais laisse la plupart des bundles hors du
 * cache. Un releve l'a montre - quarante pages en cache pour douze
 * fichiers de script, et un ChunkLoadError des la coupure.
 */

/** Adresses des scripts et feuilles de style citees par une page. */
function ressourcesDe(html: string) {
  return new Set(html.match(/\/_next\/static\/[^"'\s>]+/g) ?? []);
}
export function Prechargement() {
  const router = useRouter();
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

    /*
     * En serie plutot qu'en parallele : ce travail se fait pendant que la
     * personne consulte son atelier, et une quarantaine de requetes
     * lancees d'un coup sur un reseau mobile ralentirait ce qu'elle est en
     * train de faire. Rien ne presse ici.
     */
    (async () => {
      const dejaVues = new Set<string>();

      for (const adresse of adresses) {
        // La charge RSC, pour la navigation interne hors reseau.
        router.prefetch(adresse);

        try {
          const reponse = await fetch(adresse, { credentials: "same-origin" });
          if (!reponse.ok) continue;

          for (const ressource of ressourcesDe(await reponse.text())) {
            // Les ecrans partagent l'essentiel de leurs bundles : sans ce
            // filtre, les memes fichiers seraient redemandes une fois par
            // page de la liste.
            if (dejaVues.has(ressource)) continue;
            dejaVues.add(ressource);

            await fetch(ressource, { credentials: "same-origin" }).catch(() => {});
          }
        } catch {
          // Une page qui ne se precharge pas ne doit rien casser.
        }
      }
    })();
  }, [chargee, premierClient, premiereCommande, router]);

  return null;
}
