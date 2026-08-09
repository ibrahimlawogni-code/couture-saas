import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("clients").select("id, nom, telephone").order("nom");

  if (q) {
    query = query.or(`nom.ilike.%${q}%,telephone.ilike.%${q}%`);
  }

  const { data: clients } = await query;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900">Clients</h1>
        <Link
          href="/clients/new"
          className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white active:bg-zinc-700"
        >
          + Nouveau client
        </Link>
      </div>

      <form action="/clients" className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Chercher un nom ou un numero..."
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base"
        />
      </form>

      <ul className="mt-4 flex flex-col gap-2">
        {clients?.map((client) => (
          <li key={client.id}>
            <Link
              href={`/clients/${client.id}`}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-4 shadow-sm active:bg-zinc-100"
            >
              <span className="text-base font-medium text-zinc-900">{client.nom}</span>
              <span className="text-sm text-zinc-500">{client.telephone}</span>
            </Link>
          </li>
        ))}
        {clients?.length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-500">
            Aucun client pour l&apos;instant.
          </p>
        )}
      </ul>
    </div>
  );
}
