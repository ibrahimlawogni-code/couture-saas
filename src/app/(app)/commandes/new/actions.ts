"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAtelierId } from "@/lib/atelier";

export async function createCommandeAction(formData: FormData) {
  const clientId = String(formData.get("client_id") ?? "");
  const nomModele = String(formData.get("nom_modele") ?? "").trim() || null;
  const prixTotal = Number(formData.get("prix_total") ?? 0);
  const acompte = Number(formData.get("acompte") ?? 0);
  const dateEssayage = String(formData.get("date_essayage") ?? "") || null;
  const dateLivraison = String(formData.get("date_livraison") ?? "") || null;

  // Les photos sont deja dans Storage : le navigateur les a envoyees
  // directement, le formulaire ne transporte que leur chemin.
  const photoModele = String(formData.get("photo_modele") ?? "") || null;
  const photoTissu = String(formData.get("photo_tissu") ?? "") || null;

  const retour = `/commandes/new?client=${clientId}`;

  if (!clientId) {
    redirect(`${retour}&error=${encodeURIComponent("Client manquant")}`);
  }

  const atelierId = await getAtelierId();
  if (!atelierId) {
    redirect(`${retour}&error=${encodeURIComponent("Atelier introuvable")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // La commande fige les mesures les plus recentes du client.
  const { data: mesure } = await supabase
    .from("mesures")
    .select("id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: commande, error } = await supabase
    .from("commandes")
    .insert({
      atelier_id: atelierId,
      client_id: clientId,
      mesure_id: mesure?.id ?? null,
      nom_modele: nomModele,
      photo_modele_url: photoModele,
      photo_tissu_url: photoTissu,
      prix_total: prixTotal,
      date_essayage: dateEssayage,
      date_livraison: dateLivraison,
      cree_par: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !commande) {
    redirect(`${retour}&error=${encodeURIComponent("Impossible de creer la commande")}`);
  }

  if (acompte > 0) {
    await supabase.from("paiements").insert({
      commande_id: commande.id,
      montant: acompte,
      type: "acompte",
    });
  }

  redirect(`/commandes/${commande.id}`);
}
