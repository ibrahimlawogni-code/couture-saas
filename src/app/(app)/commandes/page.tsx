import { EnTetePage, Page } from "@/ui/page";
import { BandeauQuota, BoutonAjout } from "../quota";
import { TableauCommandes } from "./tableau";

export default function CommandesPage() {
  return (
    // Pleine largeur : les colonnes du Kanban doivent filer jusqu'aux bords
    // de l'ecran, sans quoi le defilement parait bute. Le titre et le
    // bandeau, eux, restent dans la colonne etroite commune aux autres
    // ecrans pour que l'alignement ne saute pas d'un onglet a l'autre.
    <Page largeur="pleine">
      <div className="mx-auto w-full max-w-2xl px-4">
        <EnTetePage
          titre="Commandes"
          action={
            <BoutonAjout ressource="commandes" href="/commandes/new">
              Nouvelle
            </BoutonAjout>
          }
        />
        <BandeauQuota ressource="commandes" />
      </div>

      <TableauCommandes />
    </Page>
  );
}
