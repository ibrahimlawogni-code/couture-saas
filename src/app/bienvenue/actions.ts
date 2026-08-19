"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { messageAuth } from "@/lib/messages-auth";

/*
 * Acheve une inscription que le declencheur a laissee sans atelier, faute
 * de metadonnees a l'arrivee du fournisseur (voir migration 0010).
 *
 * Tout se passe dans terminer_inscription(), cote base : c'est la que
 * vivent deja les regles - plafond de membres, validite du code, roles - et
 * les dupliquer ici les ferait diverger au premier changement.
 */
export async function terminerInscription(formData: FormData) {
  const atelier = String(formData.get("atelier") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();

  const supabase = await createClient();

  const { error } = await supabase.rpc("terminer_inscription", {
    atelier_nom: atelier,
    nom_utilisateur: nom,
    code_invitation: code,
  });

  if (error) {
    redirect(`/bienvenue?error=${encodeURIComponent(messageAuth(error.message))}`);
  }

  redirect("/tableau-de-bord");
}
