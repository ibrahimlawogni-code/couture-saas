import { traduire } from "@/lib/i18n";
import { langueVisiteur } from "@/lib/langue-visiteur";
import { SelecteurLangue } from "../selecteur-langue";
import Link from "next/link";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { Marque } from "../marque";
import { demanderReinitialisation } from "./actions";

export default async function MotDePasseOubliePage() {
  const langue = await langueVisiteur();
  const mots = traduire(langue);
  return (
    <div className="flex flex-1 items-center justify-center bg-papier px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="sur-fond-sombre rounded-panneau bg-foret p-8 text-white shadow-flottant">
          <div className="flex justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white">
              <Marque taille={40} />
            </span>
          </div>

          <p className="mt-5 text-center text-lg font-semibold tracking-tight">
            {mots.acces.motDePasseOublieTitre}
          </p>
          <p className="mt-1 text-center text-sm text-vert-pale">
            {mots.acces.motDePasseOublieTexte}
          </p>

          <form action={demanderReinitialisation} className="mt-8 flex flex-col gap-6">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <div className="flex items-center gap-3 border-b border-white/25 pb-2 focus-within:border-white">
                <EnvelopeSimple size={20} weight="light" className="text-vert-pale" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={mots.acces.adresseEmail}
                  className="w-full border-0 bg-transparent p-0 text-base text-white placeholder:text-vert-pale focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 rounded-controle bg-white px-4 py-4 text-base font-semibold tracking-wide text-foret transition-transform hover:bg-vert-clair active:translate-y-px"
            >
              {mots.acces.envoyerLien}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gris">
          <Link href="/login" className="font-medium text-encre underline">
            {mots.acces.retourConnexion}
          </Link>
        </p>

        <div className="mt-4">
          <SelecteurLangue langue={langue} />
        </div>
      </div>
    </div>
  );
}
