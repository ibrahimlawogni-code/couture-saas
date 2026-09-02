"use server";

import { redirect } from "next/navigation";
import { origineSite } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export async function demanderReinitialisation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  const origin = await origineSite();

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?suite=/nouveau-mot-de-passe`,
  });

  // Toujours la meme reponse, que l'adresse existe ou non : repondre
  // differemment reviendrait a indiquer qui possede un compte.
  redirect(
    `/login?message=${encodeURIComponent(
      "Si un atelier existe avec cette adresse, un lien de réinitialisation vient de partir."
    )}`
  );
}
