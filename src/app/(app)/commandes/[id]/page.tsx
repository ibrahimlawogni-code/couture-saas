import { LienRetour, Page } from "@/ui/page";
import { DetailCommande } from "./detail";

export default function CommandeDetailPage() {
  return (
    <Page>
      <LienRetour href="/commandes">Commandes</LienRetour>
      <DetailCommande />
    </Page>
  );
}
