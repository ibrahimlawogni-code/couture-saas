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
    return <p className="mt-8 px-4 text-sm text-zinc-500">Chargement...</p>;
  }

  if (commandes.length === 0) {
    return (
      <p className="mt-10 px-4 text-center text-sm text-zinc-500">
        Aucune commande pour l&apos;instant.
      </p>
    );
  }

  return (
    <>
      <p className="mx-auto w-full max-w-2xl px-4 text-sm text-zinc-500">
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
                <h2 className="text-sm font-semibold text-zinc-700">
                  {STATUT_LABELS[statut]}
                </h2>
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
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
                      className={`rounded-xl p-3 ${
                        commande.enAttente
                          ? "border border-dashed border-zinc-300 bg-white"
                          : "bg-white shadow-sm"
                      }`}
                    >
                      <Link href={`/commandes/${commande.id}`} className="block">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {nomsClients.get(commande.client_id) ?? "Client inconnu"}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {commande.nom_modele ?? "Sans modèle"}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              commande.enAttente
                                ? "bg-amber-100 text-amber-800"
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
                          <span className="text-xs text-zinc-500">
                            {formaterMontant(Number(commande.prix_total))}
                          </span>
                        </div>
                      </Link>

                      {suivant && !commande.enAttente && (
                        <button
                          type="button"
                          onClick={() => avancer(commande.id, suivant)}
                          disabled={horsLigne}
                          className="mt-2 w-full rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 active:bg-zinc-100 disabled:opacity-40"
                        >
                          {STATUT_LABELS[suivant]} &rarr;
                        </button>
                      )}
                    </li>
                  );
                })}

                {cartes.length === 0 && (
                  <li className="rounded-xl border border-dashed border-zinc-200 py-6 text-center text-xs text-zinc-400">
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
