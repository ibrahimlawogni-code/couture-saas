import Link from "next/link";
import { EnvelopeSimple, LockSimple } from "@phosphor-icons/react/dist/ssr";
import { Marque } from "../marque";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-papier px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl bg-foret p-8 text-white shadow-lg shadow-foret/20">
          <div className="flex justify-center">
            {/* La marque occupe la place que la maquette reservait a un
                portrait : c'est le produit qu'on identifie ici, pas la
                personne, qui ne s'est pas encore annoncee. */}
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white">
              <Marque taille={40} />
            </span>
          </div>

          <p className="mt-5 text-center text-lg font-semibold tracking-tight">
            TailorHub
          </p>
          <p className="mt-1 text-center text-sm text-vert-pale">
            Accédez à votre atelier
          </p>

          {error && (
            <p className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white">
              {error}
            </p>
          )}
          {message && (
            <p className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-vert-pale">
              {message}
            </p>
          )}

          <form action={login} className="mt-8 flex flex-col gap-6">
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
                  placeholder="Adresse email"
                  className="w-full border-0 bg-transparent p-0 text-base text-white placeholder:text-vert-pale focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <div className="flex items-center gap-3 border-b border-white/25 pb-2 focus-within:border-white">
                <LockSimple size={20} weight="light" className="text-vert-pale" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Mot de passe"
                  className="w-full border-0 bg-transparent p-0 text-base text-white placeholder:text-vert-pale focus:outline-none"
                />
              </div>
            </div>

            {/*
              La maquette proposait une case "Se souvenir de moi". Elle est
              ecartee : la session dure deja plusieurs mois sans rien cocher,
              la case n'aurait donc rien commande.
            */}
            <div className="flex justify-end">
              <Link
                href="/mot-de-passe-oublie"
                className="text-sm text-vert-pale underline underline-offset-2 hover:text-white"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              className="mt-2 rounded-2xl bg-white px-4 py-4 text-base font-semibold tracking-wide text-foret transition-transform hover:bg-vert-clair active:translate-y-px"
            >
              Se connecter
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gris">
          Pas encore d&apos;atelier ?{" "}
          <Link href="/signup" className="font-medium text-encre underline">
            En créer un
          </Link>
        </p>
      </div>
    </div>
  );
}
