import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAtelierId } from "@/lib/atelier";
import { createCommandeAction } from "./actions";
import { PhotoUpload } from "./photo-upload";

export default async function NewCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; error?: string }>;
}) {
  const { client: clientPreselectionne, error } = await searchParams;
  const supabase = await createClient();
  const atelierId = await getAtelierId();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, nom")
    .order("nom");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href="/commandes" className="text-sm text-zinc-500">
        &larr; Retour
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-zinc-900">Nouvelle commande</h1>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {clients?.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-zinc-600">
            Il faut au moins un client pour creer une commande.
          </p>
          <Link
            href="/clients/new"
            className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
          >
            Creer un client
          </Link>
        </div>
      ) : (
        <form action={createCommandeAction} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-zinc-700">
              Client
            </label>
            <select
              id="client_id"
              name="client_id"
              required
              defaultValue={clientPreselectionne ?? ""}
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base"
            >
              <option value="" disabled>
                Choisir un client
              </option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="nom_modele" className="block text-sm font-medium text-zinc-700">
              Modele
            </label>
            <input
              id="nom_modele"
              name="nom_modele"
              type="text"
              placeholder="Boubou brode, chemise..."
              className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
            />
          </div>

          {atelierId && (
            <div className="grid grid-cols-2 gap-4">
              <PhotoUpload
                name="photo_modele"
                label="Photo modele"
                atelierId={atelierId}
              />
              <PhotoUpload name="photo_tissu" label="Photo tissu" atelierId={atelierId} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prix_total"
                className="block text-sm font-medium text-zinc-700"
              >
                Prix total (FCFA)
              </label>
              <input
                id="prix_total"
                name="prix_total"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                required
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
              />
            </div>
            <div>
              <label htmlFor="acompte" className="block text-sm font-medium text-zinc-700">
                Acompte verse
              </label>
              <input
                id="acompte"
                name="acompte"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="date_essayage"
                className="block text-sm font-medium text-zinc-700"
              >
                Date d&apos;essayage
              </label>
              <input
                id="date_essayage"
                name="date_essayage"
                type="date"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
              />
            </div>
            <div>
              <label
                htmlFor="date_livraison"
                className="block text-sm font-medium text-zinc-700"
              >
                Date de livraison
              </label>
              <input
                id="date_livraison"
                name="date_livraison"
                type="date"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 rounded-xl bg-zinc-900 px-4 py-4 text-base font-medium text-white active:bg-zinc-700"
          >
            Enregistrer la commande
          </button>
        </form>
      )}
    </div>
  );
}
