import { LienRetour, Page } from "@/ui/page";
import { FicheClient } from "./fiche";

export default function ClientDetailPage() {
  return (
    <Page>
      <LienRetour href="/clients">Clients</LienRetour>
      <FicheClient />
    </Page>
  );
}
