import Link from "next/link";
import { ListeClients } from "./liste";

export default function ClientsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-encre">Clients</h1>
        <Link
          href="/clients/new"
          className="shrink-0 rounded-2xl bg-foret px-4 py-3 text-sm font-medium text-white active:bg-vert"
        >
          + Nouveau client
        </Link>
      </div>

      <ListeClients />
    </div>
  );
}
