"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createClientAction(formData: FormData) {
  const nom = String(formData.get("nom") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim() || null;
  const whatsapp = String(formData.get("whatsapp") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!nom) {
    redirect(`/clients/new?error=${encodeURIComponent("Le nom est obligatoire")}`);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await supabase
    .from("utilisateurs")
    .select("atelier_id")
    .eq("id", user?.id ?? "")
    .single();

  if (!profil) {
    redirect(`/clients/new?error=${encodeURIComponent("Profil introuvable")}`);
  }

  const { data: client, error } = await supabase
    .from("clients")
    .insert({ nom, telephone, whatsapp, notes, atelier_id: profil.atelier_id })
    .select("id")
    .single();

  if (error || !client) {
    redirect(`/clients/new?error=${encodeURIComponent("Impossible de creer le client")}`);
  }

  redirect(`/clients/${client.id}`);
}
