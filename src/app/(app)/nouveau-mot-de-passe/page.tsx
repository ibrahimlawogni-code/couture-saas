import { traduire } from "@/lib/i18n";
import { langueVisiteur } from "@/lib/langue-visiteur";
import { ChampMotDePasse } from "../../champ-mot-de-passe";
import { definirMotDePasse } from "./actions";

export default async function NouveauMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const langue = await langueVisiteur();
  const mots = traduire(langue);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-encre">
        {mots.acces.choisirMotDePasse}
      </h1>
      <p className="mt-1.5 text-sm text-gris">
        {mots.acces.choisirMotDePasseTexte}
      </p>

      {error && (
        <p className="mt-6 rounded-carte bg-rouge-clair px-4 py-3 text-sm text-rouge">
          {error}
        </p>
      )}

      <form action={definirMotDePasse} className="mt-8 flex flex-col gap-4">
        <ChampMotDePasse langue={langue} />

        <button
          type="submit"
          className="mt-2 rounded-controle bg-foret px-4 py-3.5 text-base font-medium text-white active:bg-vert"
        >
          {mots.formulaires.enregistrer}
        </button>
      </form>
    </div>
  );
}
