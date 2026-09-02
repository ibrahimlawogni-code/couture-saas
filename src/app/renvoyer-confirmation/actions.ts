"use server";

import { redirect } from "next/navigation";
import { origineSite } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export async function renvoyerConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  const origin = await origineSite();

  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  // Meme reponse quelle que soit la situation : indiquer qu'une adresse
  // existe ou non reviendrait a renseigner un curieux.
  redirect(
    `/login?message=${encodeURIComponent(
      "Si un atelier attend confirmation avec cette adresse, un nouveau lien vient de partir. Il est valable peu de temps, ouvrez-le sans tarder."
    )}`
  );
}
