"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { messageAuth } from "@/lib/messages-auth";

export async function definirMotDePasse(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      `/nouveau-mot-de-passe?error=${encodeURIComponent(messageAuth(error.message))}`
    );
  }

  redirect("/tableau-de-bord");
}
