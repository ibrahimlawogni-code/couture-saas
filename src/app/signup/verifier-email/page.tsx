import Link from "next/link";

export default function VerifierEmailPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-papier px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-encre">Vérifie tes emails</h1>
        <p className="mt-3 text-sm leading-relaxed text-gris">
          Ton atelier est créé. Clique sur le lien de confirmation qu&apos;on vient de
          t&apos;envoyer pour activer ton compte.
        </p>

        {/*
          Le lien est volontairement de courte duree. Le dire ici evite qu'on
          revienne une heure plus tard sur un lien mort sans comprendre, et
          surtout evite d'essayer de se connecter avant d'avoir confirme :
          Supabase repond alors "identifiants invalides", ce qui laisse croire
          a un mot de passe faux.
        */}
        <p className="mt-4 rounded-2xl bg-ambre-clair px-4 py-3 text-sm leading-relaxed text-ambre">
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
