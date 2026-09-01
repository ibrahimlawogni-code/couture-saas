"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { langueVisiteur } from "@/lib/langue-visiteur";
import { meriteRenvoiConfirmation, messageAuth } from "@/lib/messages-auth";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    /*
     * Le besoin d'un nouveau lien se decide ici, sur l'erreur brute, et
     * voyage jusqu'a la page. Celle-ci le devinait en cherchant le mot
     * « confirmation » dans le message traduit, qui dit « confirmée » :
     * le recours ne s'affichait donc jamais.
     */
    const parametres = new URLSearchParams({ error: messageAuth(error.message, await langueVisiteur()) });
    if (meriteRenvoiConfirmation(error.message)) {
      parametres.set("aide", "confirmation");
    }

    redirect(`/login?${parametres}`);
  }

  redirect("/tableau-de-bord");
}
