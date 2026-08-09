import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUT_LABELS, formaterMontant, type Statut } from "@/lib/commandes";

const CHAMPS_LABELS: Record<string, string> = {
  poitrine: "Poitrine",
  taille: "Taille",
  hanches: "Hanches",
  longueur_bras: "Longueur bras",
  longueur_jambe: "Longueur jambe",
  col: "Col",
  epaule: "Epaule",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, nom, telephone, whatsapp, notes")
    .eq("id", id)
    .single();

  if (!client) {
    notFound();
  }

  const { data: mesures } = await supabase
    .from("mesures")
    .select("id, libelle, valeurs, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const derniereMesure = mesures?.[0];
  const historique = mesures?.slice(1) ?? [];

  const { data: commandes } = await supabase
    .from("commandes")
    .select("id, nom_modele, statut, prix_total, date_livraison")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href="/clients" className="text-sm text-zinc-500">
        &larr; Retour
      </Link>

      <div className="mt-2">
        <h1 className="text-xl font-semibold text-zinc-900">{client.nom}</h1>
        <p className="text-sm text-zinc-500">
          {client.telephone ?? "Pas de telephone"}
          {client.whatsapp ? ` · WhatsApp ${client.whatsapp}` : ""}
        </p>
        {client.notes && <p className="mt-1 text-sm text-zinc-500">{client.notes}</p>}
      </div>

      <div className="mt-4 flex gap-3">
        <Link
          href={`/clients/${client.id}/mesures/new`}
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-900 active:bg-zinc-100"
        >
          + Mesure
        </Link>
        <Link
          href={`/commandes/new?client=${client.id}`}
          className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white active:bg-zinc-700"
        >
          + Commande
        </Link>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Dernieres mesures
        </h2>
        {derniereMesure ? (
          <div className="mt-2 rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-zinc-500">
              {new Date(derniereMesure.created_at).toLocaleDateString("fr-FR")} ·{" "}
              {derniereMesure.libelle}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(
                (derniereMesure.valeurs ?? {}) as Record<string, unknown>
              ).map(([cle, valeur]) => (
                <div
                  key={cle}
                  className="flex justify-between border-b border-zinc-100 py-1 text-sm"
                >
                  <dt className="text-zinc-500">{CHAMPS_LABELS[cle] ?? cle}</dt>
                  <dd className="font-medium text-zinc-900">{String(valeur)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Aucune mesure enregistree.</p>
        )}
      </section>

      {historique.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Historique
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {historique.map((mesure) => (
              <li
                key={mesure.id}
                className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm"
              >
                {new Date(mesure.created_at).toLocaleDateString("fr-FR")} ·{" "}
                {mesure.libelle}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Commandes
        </h2>
        {commandes && commandes.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {commandes.map((commande) => (
              <li key={commande.id}>
                <Link
                  href={`/commandes/${commande.id}`}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm active:bg-zinc-100"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {commande.nom_modele ?? "Sans modele"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {STATUT_LABELS[commande.statut as Statut]}
                      {commande.date_livraison
                        ? ` · ${new Date(commande.date_livraison).toLocaleDateString("fr-FR")}`
                        : ""}
                    </p>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {formaterMontant(Number(commande.prix_total))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Aucune commande.</p>
        )}
      </section>
    </div>
  );
}
