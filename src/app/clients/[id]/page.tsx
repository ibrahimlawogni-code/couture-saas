import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
          className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white active:bg-zinc-700"
        >
          + Nouvelle mesure
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
        <p className="mt-2 text-sm text-zinc-500">Bientot disponible.</p>
      </section>
    </div>
  );
}
