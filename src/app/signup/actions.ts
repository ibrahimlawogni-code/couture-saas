"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const atelier = String(formData.get("atelier") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const headerList = await headers();
  const origin = headerList.get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();

  // L'atelier et le profil utilisateur sont crees par le trigger
  // handle_new_user() a partir de ces metadonnees (voir migration 0003).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { atelier_nom: atelier, nom },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Confirmation email active : pas encore de session, il faut passer par le lien recu.
  if (!data.session) {
    redirect("/signup/verifier-email");
  }

  redirect("/clients");
}
