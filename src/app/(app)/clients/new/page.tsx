import Link from "next/link";
import { createClientAction } from "./actions";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href="/clients" className="text-sm text-zinc-500">
        &larr; Retour
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-zinc-900">Nouveau client</h1>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createClientAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="nom" className="block text-sm font-medium text-zinc-700">
            Nom
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
          />
        </div>
        <div>
          <label htmlFor="telephone" className="block text-sm font-medium text-zinc-700">
            Telephone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
          />
        </div>
        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium text-zinc-700">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded-xl bg-zinc-900 px-4 py-4 text-base font-medium text-white active:bg-zinc-700"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
