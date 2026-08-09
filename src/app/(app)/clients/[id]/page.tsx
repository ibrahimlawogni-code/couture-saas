import Link from "next/link";
import { FicheClient } from "./fiche";

export default function ClientDetailPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href="/clients" className="text-sm text-zinc-500">
        &larr; Retour
      </Link>

      <FicheClient />
    </div>
  );
}
