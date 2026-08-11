"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function demanderReinitialisation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  const headerList = await headers();
  const origin = headerList.get("origin") ?? "https://couture-saas.vercel.app";

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
