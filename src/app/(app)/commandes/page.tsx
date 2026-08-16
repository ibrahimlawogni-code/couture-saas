import { BandeauQuota, BoutonAjout } from "../quota";
import { TableauCommandes } from "./tableau";

export default function CommandesPage() {
  return (
    <div className="flex flex-1 flex-col py-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4">
        <h1 className="text-xl font-semibold text-encre">Commandes</h1>
        <BoutonAjout ressource="commandes" href="/commandes/new">
          + Nouvelle
        </BoutonAjout>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4">
        <BandeauQuota ressource="commandes" />
      </div>

      <TableauCommandes />
    </div>
  );
}
