import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-papier px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-encre">Connexion</h1>
        <p className="mt-1 text-sm text-gris">Accède à ton atelier</p>

        {error && (
          <p className="mt-4 rounded-2xl bg-rouge-clair px-3 py-2 text-sm text-rouge">
            {error}
          </p>
        )}

        <form action={login} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-encre">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
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
              required
              className="mt-1 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-2xl bg-foret px-4 py-3 text-base font-medium text-white active:bg-vert"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gris">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-encre underline">
            Créer un atelier
          </Link>
        </p>
      </div>
    </div>
  );
}
