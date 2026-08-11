import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const DESTINATION = "/tableau-de-bord";

// Un lien de reinitialisation demande d'aller choisir un mot de passe, pas
// d'atterrir sur le tableau de bord. Seules des destinations connues sont
// acceptees : une adresse libre ouvrirait une redirection detournable.
const SUITES = new Set(["/nouveau-mot-de-passe"]);

function echec(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
}

// Cible des liens envoyes par email : confirmation d'inscription et
// reinitialisation de mot de passe.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const erreurFournisseur = searchParams.get("error_description");
  if (erreurFournisseur) {
    return echec(origin, erreurFournisseur);
  }

  const suite = searchParams.get("suite");
  const destination = suite && SUITES.has(suite) ? suite : DESTINATION;

  const supabase = await createClient();

  // Lien a jeton : fonctionne depuis n'importe quel navigateur, y compris
  // celui integre a Gmail ou WhatsApp.
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    return error
      ? echec(origin, "Ce lien a expiré ou a déjà été utilisé.")
      : NextResponse.redirect(`${origin}${destination}`);
  }

  // Ancien format : suppose que le lien est ouvert dans le navigateur qui a
  // rempli le formulaire, ce qui est rarement le cas depuis une boite mail.
  const code = searchParams.get("code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    return error
      ? echec(
          origin,
          "Ouvrez le lien dans le même navigateur que celui de l'inscription, ou demandez-en un nouveau."
        )
      : NextResponse.redirect(`${origin}${destination}`);
  }

  return echec(origin, "Lien incomplet.");
}
