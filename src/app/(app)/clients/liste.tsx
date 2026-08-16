"use client";

import { useMemo, useState } from "react";
import {
  MagnifyingGlass,
  Users,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { formaterMontant } from "@/lib/commandes";
import { useDonnees } from "@/lib/offline/use-donnees";
import { LienBouton } from "@/ui/bouton";
import { CarteLien } from "@/ui/carte";
import { Etiquette } from "@/ui/etiquette";
import { EtatVide } from "@/ui/etat-vide";
import { SqueletteListe } from "@/ui/squelette";

export function ListeClients() {
  const { clients, commandes, paiements, chargee } = useDonnees();
  const [recherche, setRecherche] = useState("");

  /*
   * Ce que chaque client doit, et ce qu'il a en cours.
   *
   * La liste ne portait qu'un nom et un numero. On ne consulte pourtant
   * pas son carnet pour lire des numeros : on y cherche qui a une piece
   * en atelier et qui doit encore de l'argent. Les deux se calculaient
   * deja ailleurs, il fallait juste les amener ici.
   */
  const parClient = useMemo(() => {
    const verse = new Map<string, number>();
    for (const paiement of paiements) {
      verse.set(
        paiement.commande_id,
        (verse.get(paiement.commande_id) ?? 0) + Number(paiement.montant)
      );
    }

    const agregat = new Map<string, { enCours: number; reste: number }>();
    for (const commande of commandes) {
      const courant = agregat.get(commande.client_id) ?? { enCours: 0, reste: 0 };
      const du = Number(commande.prix_total) - (verse.get(commande.id) ?? 0);

      agregat.set(commande.client_id, {
        enCours: courant.enCours + (commande.statut !== "livre" ? 1 : 0),
        reste: courant.reste + (du > 0 ? du : 0),
      });
    }

    return agregat;
  }, [commandes, paiements]);

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
        {resultats.map((client) => {
          const suivi = parClient.get(client.id);
          const provisoire = client.enAttente || client.enEchec;

          return (
            <li key={client.id}>
              <CarteLien
                href={`/clients/${client.id}`}
                provisoire={provisoire}
                classe="px-4 py-3"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-base font-medium text-encre">
                    {client.nom}
                  </span>

                  {client.enEchec ? (
                    <Etiquette ton="probleme">Refusé</Etiquette>
                  ) : client.enAttente ? (
                    <Etiquette ton="systeme">En attente</Etiquette>
                  ) : (
                    suivi &&
                    suivi.reste > 0 && (
                      <span className="chiffres shrink-0 text-sm font-semibold text-rouge">
                        {formaterMontant(suivi.reste)}
                      </span>
                    )
                  )}
                </span>

                {!provisoire && (
                  <span className="mt-0.5 flex items-baseline justify-between gap-3 text-xs text-gris">
                    <span className="chiffres truncate">
                      {client.telephone ?? "Pas de téléphone"}
                    </span>
                    {suivi && suivi.enCours > 0 && (
                      <span className="shrink-0">
                        {suivi.enCours} en cours
                      </span>
                    )}
                  </span>
                )}
              </CarteLien>
            </li>
          );
        })}
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
