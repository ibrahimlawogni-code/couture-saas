"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STATUTS, type Statut } from "@/lib/commandes";

/** Avancement rapide depuis le tableau, sans quitter la vue d'ensemble. */
export async function avancerDepuisTableauAction(formData: FormData) {
  const commandeId = String(formData.get("commande_id") ?? "");
  const nouveauStatut = String(formData.get("statut") ?? "") as Statut;

  if (!commandeId || !STATUTS.includes(nouveauStatut)) return;

  const supabase = await createClient();
  await supabase
    .from("commandes")
    .update({ statut: nouveauStatut })
    .eq("id", commandeId);

  revalidatePath("/commandes");
}
