"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUTS, type Statut } from "@/lib/commandes";

export async function avancerStatutAction(formData: FormData) {
  const commandeId = String(formData.get("commande_id") ?? "");
  const nouveauStatut = String(formData.get("statut") ?? "") as Statut;

  if (!STATUTS.includes(nouveauStatut)) {
    redirect(`/commandes/${commandeId}`);
  }

  const supabase = await createClient();
  await supabase
    .from("commandes")
    .update({ statut: nouveauStatut })
    .eq("id", commandeId);

  revalidatePath(`/commandes/${commandeId}`);
  redirect(`/commandes/${commandeId}`);
}

export async function ajouterPaiementAction(formData: FormData) {
  const commandeId = String(formData.get("commande_id") ?? "");
  const montant = Number(formData.get("montant") ?? 0);

  if (montant <= 0) {
    redirect(`/commandes/${commandeId}`);
  }

  const supabase = await createClient();
  await supabase.from("paiements").insert({
    commande_id: commandeId,
    montant,
    type: "complement",
  });

  revalidatePath(`/commandes/${commandeId}`);
  redirect(`/commandes/${commandeId}`);
}
