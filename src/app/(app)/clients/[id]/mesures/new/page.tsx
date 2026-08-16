import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EnTetePage, LienRetour, Page } from "@/ui/page";
import { FormulaireMesure } from "./formulaire";

export default async function NewMesurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Page>
      <LienRetour href={`/clients/${id}`}>Fiche client</LienRetour>
      <EnTetePage titre="Nouvelle mesure" />

      <FormulaireMesure clientId={id} utilisateurId={user.id} />
    </Page>
  );
}
