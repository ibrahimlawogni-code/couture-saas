import Image from "next/image";
import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>;
}) {
  const { error, code } = await searchParams;

  // Arrive avec un code : la personne rejoint un atelier existant, elle n'a
  // donc pas a le nommer.
  const rejoint = Boolean(code);

  const champs = [
    ...(rejoint
      ? []
      : [
          {
            id: "atelier",
            label: "Nom de l'atelier",
            type: "text",
            auto: "organization",
          },
        ]),
    { id: "nom", label: "Votre nom", type: "text", auto: "name" },
    { id: "email", label: "Email", type: "email", auto: "email" },
    { id: "password", label: "Mot de passe", type: "password", auto: "new-password" },
  ];

  return (
    <div className="flex flex-1 lg:grid lg:grid-cols-2">
      <div className="flex flex-1 items-center justify-center bg-papier px-6 py-10">
        <div className="w-full max-w-xs">
          <Link href="/" className="text-lg font-semibold tracking-tight text-encre">
            TailorHub
          </Link>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-encre">
            {rejoint ? "Rejoindre l'atelier" : "Créer votre atelier"}
          </h1>
          <p className="mt-1.5 text-sm text-gris">
            {rejoint
              ? "Vous avez été invité, il ne reste qu'à créer votre compte"
              : "Quelques informations et c'est parti"}
          </p>

          {error && (
            <p className="mt-6 rounded-2xl bg-rouge-clair px-4 py-3 text-sm text-rouge">
              {error}
            </p>
          )}

          <form action={signup} className="mt-6 flex flex-col gap-3.5">
            {champs.map((champ) => (
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
                  className="mt-1.5 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
                />
              </div>
            ))}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-encre">
                Code d&apos;invitation{" "}
                {!rejoint && <span className="font-normal text-gris">(facultatif)</span>}
              </label>
              <p className="mt-1 text-xs text-gris">
                {rejoint
                  ? "Fourni par le propriétaire de l'atelier."
                  : "Si un atelier vous a invité, saisissez son code ici."}
              </p>
              <input
                id="code"
                name="code"
                type="text"
                defaultValue={code ?? ""}
                autoComplete="off"
                spellCheck={false}
                className="mt-2 w-full rounded-2xl border border-bordure px-4 py-3 text-base uppercase tracking-[0.2em]"
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-2xl bg-vert px-4 py-3.5 text-base font-medium text-white transition-colors hover:bg-foret active:translate-y-px"
            >
              {rejoint ? "Rejoindre l'atelier" : "Créer mon atelier"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gris">
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
            Commencez gratuitement, sans carte bancaire ni engagement.
          </p>
          <p className="mt-3 max-w-sm text-vert-pale">
            Vous passerez à l&apos;offre payante quand votre carnet se remplira.
          </p>
        </div>
      </div>
    </div>
  );
}
