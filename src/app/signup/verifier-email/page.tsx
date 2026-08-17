import Link from "next/link";

export default function VerifierEmailPage() {
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
        <h1 className="text-2xl font-semibold text-encre">Vérifiez vos emails</h1>
        <p className="mt-3 text-sm leading-relaxed text-gris">
          Votre compte est enregistré. Cliquez sur le lien de confirmation qui
          vient de vous être envoyé pour l&apos;activer.
        </p>

        {/*
          Le lien est volontairement de courte duree. Le dire ici evite qu'on
          revienne une heure plus tard sur un lien mort sans comprendre, et
          surtout evite d'essayer de se connecter avant d'avoir confirme :
          Supabase repond alors "identifiants invalides", ce qui laisse croire
          a un mot de passe faux.
        */}
        <p className="mt-4 rounded-carte bg-ambre-clair px-4 py-3 text-sm leading-relaxed text-ambre">
          Le lien n&apos;est valable que quelques minutes, et la connexion ne
          fonctionnera qu&apos;une fois le compte confirmé.
        </p>

        <div className="mt-6 flex flex-col gap-2 text-sm">
          <Link href="/login" className="font-medium text-encre underline">
            Retour à la connexion
          </Link>
          <Link href="/renvoyer-confirmation" className="text-gris underline">
            Le lien a expiré, en recevoir un autre
          </Link>
        </div>
      </div>
    </div>
  );
}
