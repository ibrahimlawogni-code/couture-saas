import Image from "next/image";
import Link from "next/link";
import { signup } from "./actions";

const CHAMPS = [
  { id: "atelier", label: "Nom de l'atelier", type: "text", auto: "organization" },
  { id: "nom", label: "Ton nom", type: "text", auto: "name" },
  { id: "email", label: "Email", type: "email", auto: "email" },
  { id: "password", label: "Mot de passe", type: "password", auto: "new-password" },
];

export default async function SignupPage({
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
            Créer ton atelier
          </h1>
          <p className="mt-2 text-gris">Quelques informations et c&apos;est parti</p>

          {error && (
            <p className="mt-6 rounded-2xl bg-rouge-clair px-4 py-3 text-sm text-rouge">
              {error}
            </p>
          )}

          <form action={signup} className="mt-8 flex flex-col gap-4">
            {CHAMPS.map((champ) => (
              <div key={champ.id}>
                <label
                  htmlFor={champ.id}
                  className="block text-sm font-medium text-encre"
                >
                  {champ.label}
                </label>
                <input
                  id={champ.id}
                  name={champ.id}
                  type={champ.type}
                  autoComplete={champ.auto}
                  required
                  minLength={champ.id === "password" ? 6 : undefined}
                  className="mt-1.5 w-full rounded-2xl border border-bordure px-4 py-3.5 text-base"
                />
              </div>
            ))}
            <button
              type="submit"
              className="mt-3 rounded-2xl bg-vert px-4 py-4 text-base font-medium text-white transition-colors hover:bg-foret active:translate-y-px"
            >
              Créer mon atelier
            </button>
          </form>

          <p className="mt-8 text-sm text-gris">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-encre underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {/* Voir la note sur la page de connexion : visuel reserve au grand ecran. */}
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
            Trente jours pour voir si ça vous fait gagner du temps.
          </p>
          <p className="mt-3 max-w-sm text-vert-pale">
            Sans carte bancaire, sans engagement.
          </p>
        </div>
      </div>
    </div>
  );
}
