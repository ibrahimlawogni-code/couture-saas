import Link from "next/link";

export default function VerifierEmailPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-papier px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-encre">Vérifie tes emails</h1>
        <p className="mt-3 text-sm text-gris">
          Ton atelier est créé. Clique sur le lien de confirmation qu&apos;on vient de
          t&apos;envoyer par email pour activer ton compte.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-encre underline"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
