"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { messageAuth } from "@/lib/messages-auth";

export async function signup(formData: FormData) {
  const atelier = String(formData.get("atelier") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  // Avec un code, le declencheur rattache la personne a l'atelier existant
  // au lieu d'en ouvrir un nouveau (voir migration 0007).
  const code = String(formData.get("code") ?? "").trim().toUpperCase();

  const headerList = await headers();
  const origin = headerList.get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();

  // L'atelier et le profil utilisateur sont crees par le trigger
  // handle_new_user() a partir de ces metadonnees (voir migration 0003).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { atelier_nom: atelier, nom, code_invitation: code },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(messageAuth(error.message))}`);
  }

  // Face a une adresse deja inscrite, Supabase repond comme a une inscription
  // reussie pour ne pas reveler qui possede un compte, mais ne cree rien et
  // renvoie une liste d'identites vide. Sans ce test, l'utilisateur attendrait
  // indefiniment un mail qui ne partira jamais.
  if (data.user && data.user.identities?.length === 0) {
    redirect(
      `/login?error=${encodeURIComponent(messageAuth("user already registered"))}`
    );
  }

  // Confirmation email active : pas encore de session, il faut passer par le lien recu.
  if (!data.session) {
    redirect("/signup/verifier-email");
  }

  redirect("/tableau-de-bord");
}
