import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const DESTINATION = "/tableau-de-bord";

function echec(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
}

// Cible des liens envoyes par email (confirmation d'inscription, notamment).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Supabase peut refuser lui-meme le lien avant de nous le passer.
  const erreurFournisseur = searchParams.get("error_description");
  if (erreurFournisseur) {
    return echec(origin, erreurFournisseur);
  }

  const supabase = await createClient();

  // Lien a jeton : fonctionne depuis n'importe quel navigateur, y compris
  // celui integre a Gmail ou WhatsApp.
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    return error
      ? echec(origin, "Ce lien a expire ou a deja ete utilise.")
      : NextResponse.redirect(`${origin}${DESTINATION}`);
  }

  // Ancien format : suppose que le lien est ouvert dans le navigateur qui a
  // rempli le formulaire, ce qui est rarement le cas depuis une boite mail.
  const code = searchParams.get("code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    return error
      ? echec(
          origin,
          "Ouvre le lien dans le meme navigateur que celui de l'inscription, ou demande un nouveau lien."
        )
      : NextResponse.redirect(`${origin}${DESTINATION}`);
  }

  return echec(origin, "Lien de confirmation incomplet.");
}
