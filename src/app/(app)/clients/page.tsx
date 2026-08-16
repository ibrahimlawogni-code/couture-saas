import { BandeauQuota, BoutonAjout } from "../quota";
import { ListeClients } from "./liste";

export default function ClientsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-encre">Clients</h1>
        <BoutonAjout ressource="clients" href="/clients/new">
          + Nouveau client
        </BoutonAjout>
      </div>

      <BandeauQuota ressource="clients" />

      <ListeClients />
    </div>
  );
}
