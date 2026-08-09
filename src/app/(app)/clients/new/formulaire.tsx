"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enregistrer } from "@/lib/offline/enregistrer";
import { useHydratation } from "@/lib/hydratation";

export function FormulaireClient({ atelierId }: { atelierId: string }) {
  const router = useRouter();
  const pret = useHydratation();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);

    const formulaire = new FormData(evenement.currentTarget);
    const nom = String(formulaire.get("nom") ?? "").trim();

    if (!nom) {
      setErreur("Le nom est obligatoire");
      return;
    }

    setEnvoi(true);

    // Identifiant genere ici : le client est utilisable immediatement,
    // meme si l'enregistrement part plus tard.
    const id = crypto.randomUUID();

    const { enFile } = await enregistrer("clients", {
      id,
      // Date posee ici : une saisie hors ligne doit garder l'heure a
      // laquelle elle a ete faite, pas celle de son envoi.
      created_at: new Date().toISOString(),
      atelier_id: atelierId,
      nom,
      telephone: String(formulaire.get("telephone") ?? "").trim() || null,
      whatsapp: String(formulaire.get("whatsapp") ?? "").trim() || null,
      notes: String(formulaire.get("notes") ?? "").trim() || null,
    });

    router.push(enFile ? "/clients" : `/clients/${id}`);
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="mt-6 flex flex-col gap-4">
      {erreur && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>
      )}

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
        disabled={!pret || envoi}
        className="mt-2 rounded-xl bg-zinc-900 px-4 py-4 text-base font-medium text-white active:bg-zinc-700 disabled:opacity-60"
      >
        {!pret ? "Chargement..." : envoi ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
