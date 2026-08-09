"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enregistrer } from "@/lib/offline/enregistrer";
import { useHydratation } from "@/lib/hydratation";

const CHAMPS_STANDARDS: { cle: string; label: string }[] = [
  { cle: "poitrine", label: "Poitrine (cm)" },
  { cle: "taille", label: "Taille (cm)" },
  { cle: "hanches", label: "Hanches (cm)" },
  { cle: "longueur_bras", label: "Longueur bras (cm)" },
  { cle: "longueur_jambe", label: "Longueur jambe (cm)" },
  { cle: "col", label: "Col (cm)" },
  { cle: "epaule", label: "Epaule (cm)" },
];

export function FormulaireMesure({
  clientId,
  utilisateurId,
}: {
  clientId: string;
  utilisateurId: string;
}) {
  const router = useRouter();
  const pret = useHydratation();
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setEnvoi(true);

    const formulaire = new FormData(evenement.currentTarget);
    const valeurs: Record<string, number | string> = {};

    for (const champ of CHAMPS_STANDARDS) {
      const valeur = formulaire.get(champ.cle);
      if (valeur && String(valeur).trim() !== "") {
        valeurs[champ.cle] = Number(valeur);
      }
    }

    const customNom = String(formulaire.get("champ_custom_nom") ?? "").trim();
    const customValeur = String(formulaire.get("champ_custom_valeur") ?? "").trim();
    if (customNom && customValeur) {
      valeurs[customNom] = customValeur;
    }

    await enregistrer("mesures", {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      client_id: clientId,
      libelle: String(formulaire.get("libelle") ?? "Mesures").trim() || "Mesures",
      valeurs,
      pris_par: utilisateurId,
    });

    router.push(`/clients/${clientId}`);
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="mt-6 flex flex-col gap-4">
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
        <p className="text-sm font-medium text-zinc-700">
          Champ personnalise (optionnel)
        </p>
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
        disabled={!pret || envoi}
        className="mt-2 rounded-xl bg-zinc-900 px-4 py-4 text-base font-medium text-white active:bg-zinc-700 disabled:opacity-60"
      >
        {!pret ? "Chargement..." : envoi ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
