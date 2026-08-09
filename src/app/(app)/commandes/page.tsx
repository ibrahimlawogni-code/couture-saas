import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  PRIORITE_STYLES,
  STATUTS,
  STATUT_LABELS,
  formaterMontant,
  priorite,
  statutSuivant,
  type Statut,
} from "@/lib/commandes";
import { avancerDepuisTableauAction } from "./actions";
import { CommandesEnAttente } from "./en-attente";

const LIVREES_AFFICHEES = 20;

type CarteCommande = {
  id: string;
  nom_modele: string | null;
  statut: string;
  prix_total: number;
  date_livraison: string | null;
  clients: unknown;
};

export default async function CommandesPage() {
  const supabase = await createClient();

  const colonnes =
    "id, nom_modele, statut, prix_total, date_livraison, clients(nom)";

  // Les commandes livrees s'accumulent : on n'en garde que les plus recentes.
  const [{ data: enCours }, { data: livrees }] = await Promise.all([
    supabase
      .from("commandes")
      .select(colonnes)
      .neq("statut", "livre")
      .order("date_livraison", { ascending: true, nullsFirst: false }),
    supabase
      .from("commandes")
      .select(colonnes)
      .eq("statut", "livre")
      .order("updated_at", { ascending: false })
      .limit(LIVREES_AFFICHEES),
  ]);

  const commandes = [...(enCours ?? []), ...(livrees ?? [])] as CarteCommande[];
  const total = enCours?.length ?? 0;

  return (
    <div className="flex flex-1 flex-col py-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Commandes</h1>
          <p className="text-sm text-zinc-500">{total} en cours</p>
        </div>
        <Link
          href="/commandes/new"
          className="shrink-0 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white active:bg-zinc-700"
        >
          + Nouvelle
        </Link>
      </div>

      {commandes.length === 0 ? (
        <p className="mt-10 px-4 text-center text-sm text-zinc-500">
          Aucune commande pour l&apos;instant.
        </p>
      ) : (
        // Colonnes qui defilent au doigt : un tableau a 7 colonnes ne tient
        // pas sur un ecran de telephone.
        <div className="mt-4 flex gap-3 overflow-x-auto px-4 pb-4">
          {STATUTS.map((statut) => {
            const cartes = commandes.filter((commande) => commande.statut === statut);

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

                <div className="mt-2">
                  {statut === "recu" && <CommandesEnAttente />}
                </div>

                <ul className="flex flex-col gap-2">
                  {cartes.map((commande) => {
                    const client = commande.clients as { nom: string } | null;
                    const niveau = priorite(
                      commande.date_livraison,
                      commande.statut as Statut
                    );
                    const suivant = statutSuivant(commande.statut as Statut);

                    return (
                      <li
                        key={commande.id}
                        className="rounded-xl bg-white p-3 shadow-sm"
                      >
                        <Link href={`/commandes/${commande.id}`} className="block">
                          <p className="text-sm font-medium text-zinc-900">
                            {client?.nom ?? "Client inconnu"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {commande.nom_modele ?? "Sans modele"}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITE_STYLES[niveau]}`}
                            >
                              {commande.date_livraison
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

                        {suivant && (
                          <form action={avancerDepuisTableauAction} className="mt-2">
                            <input
                              type="hidden"
                              name="commande_id"
                              value={commande.id}
                            />
                            <input type="hidden" name="statut" value={suivant} />
                            <button
                              type="submit"
                              className="w-full rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 active:bg-zinc-100"
                            >
                              {STATUT_LABELS[suivant]} &rarr;
                            </button>
                          </form>
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
      )}
    </div>
  );
}
