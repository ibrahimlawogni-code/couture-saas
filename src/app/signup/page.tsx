import Image from "next/image";
import Link from "next/link";
import { FormulaireInscription } from "./formulaire";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>;
}) {
  const { error, code } = await searchParams;

  return (
    <div className="flex flex-1 lg:grid lg:grid-cols-2">
      <div className="flex flex-1 items-center justify-center bg-papier px-6 py-6">
        <div className="w-full max-w-xs">
          <Link href="/" className="text-lg font-semibold tracking-tight text-encre">
            TailorHub
          </Link>

          {/*
           * Titre, champs et bouton dependent tous du code d'invitation,
           * qui peut arriver par le lien comme etre tape a la main. Ils
           * sont donc rendus ensemble, cote client, la ou cet etat vit.
           */}
          <FormulaireInscription code={code} erreur={error} />

          <p className="mt-5 text-sm text-gris">
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
