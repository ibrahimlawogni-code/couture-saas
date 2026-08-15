import Image from "next/image";
import Link from "next/link";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { ChampMotDePasse } from "../champ-mot-de-passe";
import { Marque } from "../marque";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-papier px-5 py-6">
      {/*
        L'atelier passe derriere la carte, sur grand ecran seulement. Sur un
        telephone, le clavier couvre la moitie de l'ecran et la photo ne
        ferait qu'alourdir le chargement pour une image qu'on ne verrait pas.
      */}
      <div className="absolute inset-0 hidden lg:block">
        <Image
          src="/photos/atelier.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-foret/80" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="rounded-3xl bg-foret p-6 text-white shadow-lg shadow-foret/20">
          <div className="flex justify-center">
            {/* La marque occupe la place que la maquette reservait a un
                portrait : c'est le produit qu'on identifie ici, pas la
                personne, qui ne s'est pas encore annoncee. */}
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
              <Marque taille={32} />
            </span>
          </div>

          <p className="mt-4 text-center text-lg font-semibold tracking-tight">
            TailorHub
          </p>
          <p className="mt-1 text-center text-sm text-vert-pale">
            Accédez à votre atelier
          </p>

          {/* Un refus doit se distinguer d'une simple information, meme sur
              fond sombre : teinte rouge et liseré, texte blanc pour rester
              lisible. */}
          {error && (
            <div className="mt-6 rounded-2xl bg-rouge/35 px-4 py-3 text-sm leading-relaxed text-white ring-1 ring-rouge/60">
              <p>{error}</p>
              {/* Le recours s'affiche la ou le probleme se pose, plutot que
                  d'encombrer le formulaire en permanence. */}
              {/confirmation/i.test(error) && (
                <Link
                  href="/renvoyer-confirmation"
                  className="mt-2 inline-block font-medium text-white underline underline-offset-2"
                >
                  Renvoyer le lien
                </Link>
              )}
            </div>
          )}
          {message && (
            <p className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-vert-pale">
              {message}
            </p>
          )}

          <form action={login} className="mt-6 flex flex-col gap-5">
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

            <ChampMotDePasse
              autoComplete="current-password"
              criteres={false}
              surFondSombre
            />

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
              className="mt-1 rounded-2xl bg-white px-4 py-3.5 text-base font-semibold tracking-wide text-foret transition-transform hover:bg-vert-clair active:translate-y-px"
            >
              Se connecter
            </button>
          </form>
        </div>

        {/* Sur grand ecran cette ligne repose sur la photo assombrie : le gris
            du fond papier n'y aurait pas assez de contraste. */}
        <p className="mt-5 text-center text-sm text-gris lg:text-vert-pale">
          Pas encore d&apos;atelier ?{" "}
          <Link
            href="/signup"
            className="font-medium text-encre underline lg:text-white"
          >
            En créer un
          </Link>
        </p>
      </div>
    </div>
  );
}
