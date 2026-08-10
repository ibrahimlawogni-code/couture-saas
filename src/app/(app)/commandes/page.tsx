import Link from "next/link";
import { TableauCommandes } from "./tableau";

export default function CommandesPage() {
  return (
    <div className="flex flex-1 flex-col py-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4">
        <h1 className="text-xl font-semibold text-encre">Commandes</h1>
        <Link
          href="/commandes/new"
          className="shrink-0 rounded-2xl bg-foret px-4 py-3 text-sm font-medium text-white active:bg-vert"
        >
          + Nouvelle
        </Link>
      </div>

      <TableauCommandes />
    </div>
  );
}
