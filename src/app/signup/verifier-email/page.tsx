import Link from "next/link";

export default function VerifierEmailPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Verifie tes emails</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Ton atelier est cree. Clique sur le lien de confirmation qu&apos;on vient de
          t&apos;envoyer par email pour activer ton compte.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-zinc-900 underline"
        >
          Retour a la connexion
        </Link>
      </div>
    </div>
  );
}
