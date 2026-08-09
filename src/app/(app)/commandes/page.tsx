import Link from "next/link";
import { TableauCommandes } from "./tableau";

export default function CommandesPage() {
  return (
    <div className="flex flex-1 flex-col py-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4">
        <h1 className="text-xl font-semibold text-zinc-900">Commandes</h1>
        <Link
          href="/commandes/new"
          className="shrink-0 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white active:bg-zinc-700"
        >
          + Nouvelle
        </Link>
      </div>

      <TableauCommandes />
    </div>
  );
}
