import { CloudSlash } from "@phosphor-icons/react/dist/ssr";
import { LienBouton } from "@/ui/bouton";
import { Carte } from "@/ui/carte";

export default function HorsLignePage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-papier px-4 py-8">
      <Carte classe="w-full max-w-sm p-8 text-center">
        <span
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-bleu-clair text-bleu"
        >
          <CloudSlash size={24} weight="duotone" />
        </span>

        <h1 className="mt-4 text-xl font-semibold tracking-tight text-encre">
          Pas de connexion
        </h1>

        {/*
         * Vouvoiement, comme partout ailleurs dans l'application. Cette
         * page tutoyait, seule de son espece, et deux accents manquaient.
         */}
        {/*
         * Espace insecable avant le deux-points : la typographie francaise
         * l'exige, et sans elle le signe se retrouve seul en tete de ligne
         * des que le texte se replie sur un ecran etroit.
         */}
        <p className="mt-2 text-sm text-gris">
          Cette page n&apos;a pas encore été consultée&nbsp;: elle n&apos;est
          donc pas disponible hors ligne. Les écrans déjà ouverts, eux, restent
          accessibles.
        </p>

        <LienBouton href="/tableau-de-bord" classe="mt-6">
          Retour à l&apos;accueil
        </LienBouton>
      </Carte>
    </div>
  );
}
