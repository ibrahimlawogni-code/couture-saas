import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Creer ton atelier</h1>
        <p className="mt-1 text-sm text-zinc-500">Quelques infos pour démarrer</p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form action={signup} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="atelier" className="block text-sm font-medium text-zinc-700">
              Nom de l&apos;atelier
            </label>
            <input
              id="atelier"
              name="atelier"
              type="text"
              required
              className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-zinc-700">
              Ton nom
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
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-base"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-xl bg-zinc-900 px-4 py-3 text-base font-medium text-white active:bg-zinc-700"
          >
            Créer mon atelier
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
