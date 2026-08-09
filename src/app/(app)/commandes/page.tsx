import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  PRIORITE_LABELS,
  PRIORITE_STYLES,
  STATUT_LABELS,
  formaterMontant,
  priorite,
  type Statut,
} from "@/lib/commandes";

export default async function CommandesPage() {
  const supabase = await createClient();

  const { data: commandes } = await supabase
    .from("commandes")
    .select("id, nom_modele, statut, prix_total, date_livraison, clients(nom)")
    .neq("statut", "livre")
    .order("date_livraison", { ascending: true, nullsFirst: false });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900">Commandes</h1>
        <Link
          href="/commandes/new"
          className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white active:bg-zinc-700"
        >
          + Nouvelle
        </Link>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {commandes?.map((commande) => {
          const client = commande.clients as unknown as { nom: string } | null;
          const niveau = priorite(commande.date_livraison, commande.statut as Statut);

          return (
            <li key={commande.id}>
              <Link
                href={`/commandes/${commande.id}`}
                className="block rounded-xl bg-white px-4 py-4 shadow-sm active:bg-zinc-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-zinc-900">
                      {client?.nom ?? "Client inconnu"}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {commande.nom_modele ?? "Sans modele"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${PRIORITE_STYLES[niveau]}`}
                  >
                    {PRIORITE_LABELS[niveau]}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                    {STATUT_LABELS[commande.statut as Statut]}
                  </span>
                  <span className="text-zinc-500">
                    {commande.date_livraison
                      ? new Date(commande.date_livraison).toLocaleDateString("fr-FR")
                      : "Pas de date"}
                    {" · "}
                    {formaterMontant(Number(commande.prix_total))}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
        {commandes?.length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-500">
            Aucune commande en cours.
          </p>
        )}
      </ul>
    </div>
  );
}
