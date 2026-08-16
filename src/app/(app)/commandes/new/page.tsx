import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAtelierId } from "@/lib/atelier";
import { EnTetePage, LienRetour, Page } from "@/ui/page";
import { FormulaireCommande } from "./formulaire";

export default async function NewCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: clientPreselectionne } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const atelierId = await getAtelierId();

  if (!user || !atelierId) {
    redirect("/login");
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, nom")
    .order("nom");

  return (
    <Page>
      <LienRetour href="/commandes">Commandes</LienRetour>
      <EnTetePage titre="Nouvelle commande" />

      <FormulaireCommande
        atelierId={atelierId}
        utilisateurId={user.id}
        clients={clients ?? []}
        clientPreselectionne={clientPreselectionne}
      />
    </Page>
  );
}
