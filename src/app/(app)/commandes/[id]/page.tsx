import Link from "next/link";
import { DetailCommande } from "./detail";

export default function CommandeDetailPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href="/commandes" className="text-sm text-zinc-500">
        &larr; Retour
      </Link>

      <DetailCommande />
    </div>
  );
}
