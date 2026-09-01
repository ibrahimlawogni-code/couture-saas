import { traduire } from "@/lib/i18n";
import { langueVisiteur } from "@/lib/langue-visiteur";
import Link from "next/link";

export default async function VerifierEmailPage() {
  const langue = await langueVisiteur();
  const mots = traduire(langue);
  return (
    <div className="flex flex-1 items-center justify-center bg-papier px-4">
      <div className="w-full max-w-sm rounded-panneau border border-bordure bg-white p-8 text-center shadow-carte">
        {/*
         * Vouvoiement, comme partout ailleurs dans l'application : cette
         * page etait la derniere a tutoyer.
         *
         * Et rien sur « votre atelier est cree » : la meme page sert a qui
         * ouvre un atelier et a qui en rejoint un par code d'invitation.
         * Pour ce dernier aucun atelier n'a ete cree, il a ete rattache a
         * celui de son patron.
         */}
        <h1 className="text-2xl font-semibold text-encre">
          {mots.acces.verifiezEmails}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gris">
          {mots.acces.verifiezEmailsTexte}
        </p>

        {/*
          Le lien est volontairement de courte duree. Le dire ici evite qu'on
          revienne une heure plus tard sur un lien mort sans comprendre, et
          surtout evite d'essayer de se connecter avant d'avoir confirme :
          Supabase repond alors "identifiants invalides", ce qui laisse croire
          a un mot de passe faux.
        */}
        <p className="mt-4 rounded-carte bg-ambre-clair px-4 py-3 text-sm leading-relaxed text-ambre">
          {mots.acces.lienCourteDuree}
        </p>

        <div className="mt-6 flex flex-col gap-2 text-sm">
          <Link href="/login" className="font-medium text-encre underline">
            {mots.acces.retourConnexion}
          </Link>
          <Link href="/renvoyer-confirmation" className="text-gris underline">
            {mots.acces.lienExpire}
          </Link>
        </div>
      </div>
    </div>
  );
}
