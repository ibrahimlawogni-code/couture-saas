import Image from "next/image";
import Link from "next/link";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { GOOGLE_ACTIF } from "@/lib/fournisseurs";
import { traduire } from "@/lib/i18n";
import { langueVisiteur } from "@/lib/langue-visiteur";
import { SelecteurLangue } from "../selecteur-langue";
import { BoutonGoogle, Separateur } from "../bouton-google";
import { ChampMotDePasse } from "../champ-mot-de-passe";
import { Marque } from "../marque";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; aide?: string }>;
}) {
  const { error, message, aide } = await searchParams;
  const langue = await langueVisiteur();
  const mots = traduire(langue);

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
        {/* sur-fond-sombre bascule l'anneau de focus en blanc : le vert de
            l'anneau par defaut est invisible sur le vert forêt. */}
        <div className="sur-fond-sombre rounded-panneau bg-foret p-6 text-white shadow-flottant">
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
            {mots.acces.accroche}
          </p>

          {/* Un refus doit se distinguer d'une simple information, meme sur
              fond sombre : teinte rouge et liseré, texte blanc pour rester
              lisible. */}
          {error && (
            <div
              role="alert"
              className="mt-6 rounded-carte bg-rouge/35 px-4 py-3 text-sm leading-relaxed text-white ring-1 ring-rouge/60"
            >
              <p>{error}</p>
              {/* Le recours s'affiche la ou le probleme se pose, plutot que
                  d'encombrer le formulaire en permanence. */}
              {aide === "confirmation" && (
                <Link
                  href="/renvoyer-confirmation"
                  className="mt-2 inline-block font-medium text-white underline underline-offset-2"
                >
                  {mots.acces.renvoyerLien}
                </Link>
              )}
            </div>
          )}
          {message && (
            <p
              role="status"
              className="mt-6 rounded-carte bg-white/10 px-4 py-3 text-sm text-vert-pale"
            >
              {message}
            </p>
          )}

          {/*
           * Le fournisseur avant le formulaire : c'est le chemin le plus
           * court, et sur l'Android d'un tailleur le compte Google est deja
           * ouvert sur l'appareil. Le mot de passe reste juste dessous, un
           * telephone partage ou un compte perdu ne devant pas fermer la
           * porte de l'atelier.
           */}
          {GOOGLE_ACTIF && (
            <div className="mt-6 flex flex-col gap-5">
              <BoutonGoogle langue={langue} surFondSombre />
              <Separateur langue={langue} surFondSombre />
            </div>
          )}

          <form
            action={login}
            className={`flex flex-col gap-5 ${GOOGLE_ACTIF ? "mt-5" : "mt-6"}`}
          >
            <div>
              <label htmlFor="email" className="sr-only">
                {mots.acces.email}
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

            <ChampMotDePasse
              langue={langue}
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
                {mots.acces.motDePasseOublie}
              </Link>
            </div>

            <button
              type="submit"
              className="mt-1 flex min-h-12 items-center justify-center rounded-controle bg-white px-4 text-base font-semibold tracking-wide text-foret transition-colors duration-150 ease-doux hover:bg-vert-clair active:translate-y-px"
            >
              {mots.acces.seConnecter}
            </button>
          </form>
        </div>

        {/* Sur grand ecran cette ligne repose sur la photo assombrie : le gris
            du fond papier n'y aurait pas assez de contraste. */}
        <p className="mt-5 text-center text-sm text-gris lg:text-vert-pale">
          {mots.acces.pasEncoreAtelier}{" "}
          <Link
            href="/signup"
            className="font-medium text-encre underline lg:text-white"
          >
            {mots.acces.enCreerUn}
          </Link>
        </p>

        {/*
         * Le choix de langue vit ici, sous la carte : avant toute connexion
         * il n'y a pas d'atelier dont lire la langue, et un tailleur
         * anglophone qui tombe sur une page qu'il ne lit pas s'en va avant
         * d'avoir vu le produit.
         */}
        <div className="mt-4">
          <SelecteurLangue langue={langue} />
        </div>
      </div>
    </div>
  );
}
