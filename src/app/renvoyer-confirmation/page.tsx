import Link from "next/link";
import { renvoyerConfirmation } from "./actions";

export default function RenvoyerConfirmationPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-papier px-5 py-6">
      <div className="w-full max-w-xs">
        <Link href="/login" className="text-sm text-gris">
          &larr; Retour
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-encre">
          Renvoyer le lien
        </h1>
        <p className="mt-1.5 text-sm text-gris">
          Le lien de confirmation expire vite. Indiquez votre adresse et nous
          vous en envoyons un nouveau.
        </p>

        <form action={renvoyerConfirmation} className="mt-6 flex flex-col gap-3">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-encre">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1.5 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-2xl bg-vert px-4 py-3.5 text-base font-medium text-white transition-colors hover:bg-foret active:translate-y-px"
          >
            Envoyer un nouveau lien
          </button>
        </form>
      </div>
    </div>
  );
}
