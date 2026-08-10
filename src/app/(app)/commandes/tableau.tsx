"use client";

import { useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  PRIORITE_STYLES,
  STATUTS,
  STATUT_LABELS,
  formaterMontant,
  priorite,
  statutSuivant,
  type Statut,
} from "@/lib/commandes";
import { rafraichirMiroir } from "@/lib/offline/miroir";
import { useDonnees } from "@/lib/offline/use-donnees";
import { useFileAttente } from "@/lib/offline/use-file-attente";

const LIVREES_AFFICHEES = 20;

export function TableauCommandes() {
  const { clients, commandes, chargee } = useDonnees();
  const { horsLigne } = useFileAttente();

  const nomsClients = useMemo(
    () => new Map(clients.map((client) => [client.id, client.nom])),
    [clients]
  );

  const parStatut = useMemo(() => {
    const groupes = new Map<Statut, typeof commandes>();

    for (const statut of STATUTS) {
      const cartes = commandes
        .filter((commande) => (commande.statut as Statut) === statut)
        .sort((a, b) => {
          const dateA = a.date_livraison ?? "9999";
          const dateB = b.date_livraison ?? "9999";
          return dateA.localeCompare(dateB);
        });

      groupes.set(
        statut,
        statut === "livre" ? cartes.slice(0, LIVREES_AFFICHEES) : cartes
      );
    }

    return groupes;
  }, [commandes]);

  const enCours = commandes.filter((commande) => commande.statut !== "livre").length;

  /**
   * L'avancement passe par le reseau : c'est une modification, pas une
   * creation, et la file locale ne gere que les creations.
   */
  async function avancer(commandeId: string, statut: Statut) {
    const supabase = createClient();
    const { error } = await supabase
      .from("commandes")
      .update({ statut })
      .eq("id", commandeId);

    if (!error) await rafraichirMiroir();
  }

  if (!chargee) {
    return <p className="mt-8 px-4 text-sm text-gris">Chargement...</p>;
  }

  if (commandes.length === 0) {
    return (
      <p className="mt-10 px-4 text-center text-sm text-gris">
        Aucune commande pour l&apos;instant.
      </p>
    );
  }

  return (
    <>
      <p className="mx-auto w-full max-w-2xl px-4 text-sm text-gris">
        {enCours} en cours
      </p>

      {/* Colonnes qui defilent au doigt : sept colonnes ne tiennent pas
          sur un ecran de telephone. */}
      <div className="mt-4 flex gap-3 overflow-x-auto px-4 pb-4">
        {STATUTS.map((statut) => {
          const cartes = parStatut.get(statut) ?? [];

          return (
            <section key={statut} className="w-64 shrink-0">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-encre">
                  {STATUT_LABELS[statut]}
                </h2>
                <span className="rounded-full bg-vert-clair px-2 py-0.5 text-xs font-medium text-gris">
                  {cartes.length}
                </span>
              </div>

              <ul className="mt-2 flex flex-col gap-2">
                {cartes.map((commande) => {
                  const niveau = priorite(
                    commande.date_livraison,
                    commande.statut as Statut
                  );
                  const suivant = statutSuivant(commande.statut as Statut);

                  return (
                    <li
                      key={commande.id}
                      className={`rounded-2xl p-3 ${
                        commande.enAttente
                          ? "border border-dashed border-bordure bg-white"
                          : "bg-white shadow-sm"
                      }`}
                    >
                      <Link href={`/commandes/${commande.id}`} className="block">
                        <p className="truncate text-sm font-medium text-encre">
                          {nomsClients.get(commande.client_id) ?? "Client inconnu"}
                        </p>
                        <p className="truncate text-xs text-gris">
                          {commande.nom_modele ?? "Sans modèle"}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              commande.enAttente
                                ? "bg-bleu-clair text-bleu"
                                : PRIORITE_STYLES[niveau]
                            }`}
                          >
                            {commande.enAttente
                              ? "En attente"
                              : commande.date_livraison
                                ? new Date(commande.date_livraison).toLocaleDateString(
                                    "fr-FR",
                                    { day: "2-digit", month: "2-digit" }
                                  )
                                : "Sans date"}
                          </span>
                          <span className="text-xs text-gris">
                            {formaterMontant(Number(commande.prix_total))}
                          </span>
                        </div>
                      </Link>

                      {suivant && !commande.enAttente && (
                        <button
                          type="button"
                          onClick={() => avancer(commande.id, suivant)}
                          disabled={horsLigne}
                          className="mt-2 w-full rounded-2xl border border-bordure py-2 text-xs font-medium text-gris active:bg-papier disabled:opacity-40"
                        >
                          {STATUT_LABELS[suivant]} &rarr;
                        </button>
                      )}
                    </li>
                  );
                })}

                {cartes.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-bordure py-6 text-center text-xs text-gris">
                    Vide
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
