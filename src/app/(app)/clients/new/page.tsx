import { redirect } from "next/navigation";
import { EnTetePage, LienRetour, Page } from "@/ui/page";
import { getAtelierId } from "@/lib/atelier";
import { FormulaireClient } from "./formulaire";

export default async function NewClientPage() {
  const atelierId = await getAtelierId();

  if (!atelierId) {
    redirect("/login");
  }

  return (
    <Page>
      <LienRetour href="/clients">Clients</LienRetour>
      <EnTetePage titre="Nouveau client" />

      <FormulaireClient atelierId={atelierId} />
    </Page>
  );
}
