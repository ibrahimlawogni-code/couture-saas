import { EnTetePage, Page } from "@/ui/page";
import { BandeauQuota, BoutonAjout } from "../quota";
import { TableauCommandes } from "./tableau";

export default function CommandesPage() {
  return (
    // La liste s'etale sur grand ecran, ou chaque ligne porte ses colonnes.
    // Elle etait en pleine largeur du temps du Kanban, dont les sept
    // colonnes devaient filer jusqu'aux bords sans quoi le defilement
    // paraissait bute.
    <Page largeur="large">
      <EnTetePage
        titre="Commandes"
        action={
          <BoutonAjout ressource="commandes" href="/commandes/new">
            Nouvelle
          </BoutonAjout>
        }
      />
      <BandeauQuota ressource="commandes" />

      <TableauCommandes />
    </Page>
  );
}
