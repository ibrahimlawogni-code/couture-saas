import Link from "next/link";
import { createMesureAction } from "./actions";

const CHAMPS_STANDARDS: { cle: string; label: string }[] = [
  { cle: "poitrine", label: "Poitrine (cm)" },
  { cle: "taille", label: "Taille (cm)" },
  { cle: "hanches", label: "Hanches (cm)" },
  { cle: "longueur_bras", label: "Longueur bras (cm)" },
  { cle: "longueur_jambe", label: "Longueur jambe (cm)" },
  { cle: "col", label: "Col (cm)" },
  { cle: "epaule", label: "Epaule (cm)" },
];

export default async function NewMesurePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href={`/clients/${id}`} className="text-sm text-zinc-500">
        &larr; Retour
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-zinc-900">Nouvelle mesure</h1>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createMesureAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="client_id" value={id} />

        <div>
          <label htmlFor="libelle" className="block text-sm font-medium text-zinc-700">
            Libelle
          </label>
          <input
            id="libelle"
            name="libelle"
            type="text"
            defaultValue="Mesures"
            className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {CHAMPS_STANDARDS.map((champ) => (
            <div key={champ.cle}>
              <label
                htmlFor={champ.cle}
                className="block text-sm font-medium text-zinc-700"
              >
                {champ.label}
              </label>
              <input
                id={champ.cle}
                name={champ.cle}
                type="number"
                step="0.5"
                inputMode="decimal"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
              />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-zinc-300 p-4">
          <p className="text-sm font-medium text-zinc-700">Champ personnalise (optionnel)</p>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <input
              name="champ_custom_nom"
              type="text"
              placeholder="Nom du champ"
              className="rounded-xl border border-zinc-300 px-4 py-3 text-base"
            />
            <input
              name="champ_custom_valeur"
              type="text"
              placeholder="Valeur"
              className="rounded-xl border border-zinc-300 px-4 py-3 text-base"
            />
          </div>
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
