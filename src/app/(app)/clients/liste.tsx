"use client";

import { useMemo, useState } from "react";
import {
  MagnifyingGlass,
  Users,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { useDonnees } from "@/lib/offline/use-donnees";
import { LienBouton } from "@/ui/bouton";
import { CarteLien } from "@/ui/carte";
import { Etiquette } from "@/ui/etiquette";
import { EtatVide } from "@/ui/etat-vide";
import { SqueletteListe } from "@/ui/squelette";

export function ListeClients() {
  const { clients, chargee } = useDonnees();
  const [recherche, setRecherche] = useState("");

  const resultats = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return clients;

    return clients.filter(
      (client) =>
        client.nom.toLowerCase().includes(terme) ||
        (client.telephone ?? "").includes(terme) ||
        (client.whatsapp ?? "").includes(terme)
    );
  }, [clients, recherche]);

  if (!chargee) {
    return (
      <div className="mt-4">
        <SqueletteListe />
      </div>
    );
  }

  /*
   * Un atelier sans aucun client n'a pas besoin d'un champ de recherche :
   * il n'y a rien a chercher, et le champ ne fait qu'occuper la place ou
   * devrait se trouver l'invitation a commencer.
   */
  if (clients.length === 0) {
    return (
      <EtatVide
        classe="mt-6"
        icone={Users}
        titre="Aucun client"
        texte="Créez une fiche client pour enregistrer ses mesures et lui ouvrir des commandes."
        action={<LienBouton href="/clients/new">Créer le premier client</LienBouton>}
      />
    );
  }

  return (
    <>
      <div className="relative mt-4">
        <MagnifyingGlass
          size={17}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gris"
        />
        <input
          type="search"
          value={recherche}
          onChange={(evenement) => setRecherche(evenement.target.value)}
          placeholder="Chercher un nom ou un numéro..."
          aria-label="Chercher un client"
          /*
           * appearance-none retire la croix native de Safari et Chrome,
           * qui se posait par-dessus la notre et donnait deux boutons
           * d'effacement superposes.
           */
          className="min-h-11 w-full appearance-none rounded-controle border border-bordure bg-white py-3 pr-11 pl-11 text-base text-encre transition-colors duration-150 ease-doux hover:border-vert-pale [&::-webkit-search-cancel-button]:hidden"
        />
        {recherche && (
          <button
            type="button"
            onClick={() => setRecherche("")}
            aria-label="Effacer la recherche"
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-gris transition-colors hover:bg-papier hover:text-encre"
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      {recherche && (
        <p aria-live="polite" className="mt-3 text-sm text-gris">
          {resultats.length === 0
            ? "Aucun résultat"
            : `${resultats.length} client${resultats.length > 1 ? "s" : ""} trouvé${
                resultats.length > 1 ? "s" : ""
              }`}
        </p>
      )}

      <ul className="mt-3 flex flex-col gap-2">
        {resultats.map((client) => (
          <li key={client.id}>
            <CarteLien
              href={`/clients/${client.id}`}
              provisoire={client.enAttente || client.enEchec}
              classe="flex items-center justify-between gap-3 px-4 py-3.5"
            >
              <span className="min-w-0 truncate text-base font-medium text-encre">
                {client.nom}
              </span>
              {client.enEchec ? (
                <Etiquette ton="probleme">Refusé</Etiquette>
              ) : client.enAttente ? (
                <Etiquette ton="systeme">En attente</Etiquette>
              ) : (
                <span className="chiffres shrink-0 text-sm text-gris">
                  {client.telephone}
                </span>
              )}
            </CarteLien>
          </li>
        ))}
      </ul>

      {/*
       * Une recherche infructueuse n'est pas un ecran vide : la personne a
       * des clients, elle n'a simplement pas trouve celui-la. Lui proposer
       * de creer une fiche serait souvent une erreur - c'est plus souvent
       * une faute de frappe qu'un client absent.
       */}
      {resultats.length === 0 && (
        <p className="mt-8 text-center text-sm text-gris">
          Aucun client ne correspond à «&nbsp;{recherche.trim()}&nbsp;».{" "}
          <button
            type="button"
            onClick={() => setRecherche("")}
            className="font-medium text-vert underline underline-offset-2"
          >
            Voir tous les clients
          </button>
        </p>
      )}
    </>
  );
}
