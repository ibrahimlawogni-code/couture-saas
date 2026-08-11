import Image from "next/image";
import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 lg:grid lg:grid-cols-2">
      <div className="flex flex-1 items-center justify-center bg-papier px-5 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="text-lg font-semibold tracking-tight text-encre">
            TailorHub
          </Link>

          <h1 className="mt-10 text-3xl font-semibold tracking-tight text-encre">
            Bon retour
          </h1>
          <p className="mt-2 text-gris">Accède à ton atelier</p>

          {error && (
            <p className="mt-6 rounded-2xl bg-rouge-clair px-4 py-3 text-sm text-rouge">
              {error}
            </p>
          )}

          <form action={login} className="mt-8 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-encre">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1.5 w-full rounded-2xl border border-bordure px-4 py-3.5 text-base"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-encre">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1.5 w-full rounded-2xl border border-bordure px-4 py-3.5 text-base"
              />
            </div>
            <button
              type="submit"
              className="mt-3 rounded-2xl bg-vert px-4 py-4 text-base font-medium text-white transition-colors hover:bg-foret active:translate-y-px"
            >
              Se connecter
            </button>
          </form>

          <p className="mt-8 text-sm text-gris">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="font-medium text-encre underline">
              Créer un atelier
            </Link>
          </p>
        </div>
      </div>

      {/*
        Visuel reserve au grand ecran. Sur un telephone, le clavier occupe deja
        la moitie de la hauteur : une photo repousserait le formulaire hors de
        vue et ralentirait le chargement pour rien.
      */}
      <div className="relative hidden lg:block">
        <Image
          src="/photos/atelier.jpg"
          alt="Un tailleur au travail dans son atelier"
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-foret/55" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="max-w-sm text-2xl font-semibold leading-snug tracking-tight text-white">
            Vos mesures, vos commandes et vos acomptes, au même endroit.
          </p>
          <p className="mt-3 max-w-sm text-vert-pale">
            Même quand la connexion vous lâche.
          </p>
        </div>
      </div>
    </div>
  );
}
