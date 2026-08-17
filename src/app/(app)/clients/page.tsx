import { EnTetePage, Page } from "@/ui/page";
import { BandeauQuota, BoutonAjout } from "../quota";
import { ListeClients } from "./liste";

export default function ClientsPage() {
  return (
    <Page>
      <EnTetePage
        titre="Clients"
        action={
          <BoutonAjout ressource="clients" href="/clients/new">
            Nouveau client
          </BoutonAjout>
        }
      />

      <BandeauQuota ressource="clients" />

      <ListeClients />
    </Page>
  );
}
