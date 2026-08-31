import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { reconcilierAbonnements } from "@/lib/abonnement";

/**
 * Entretien nocturne des abonnements.
 *
 * Deux travaux sans rapport l'un avec l'autre, et l'ordre le dit : on
 * retrograde d'abord les periodes finies, on rattrape ensuite les
 * versements. Un atelier qui a paye cette nuit ne doit pas etre retrograde
 * par le passage qui suit son paiement.
 *
 * Le rattrapage est le filet du filet. La notification de SASPay credite
 * dans la seconde, le retour du navigateur aussi ; ce passage n'attrape que
 * ce que les deux ont laisse filer - une notification perdue, une panne de
 * notre cote pendant que quelqu'un payait.
 *
 * Appelee chaque nuit par la planification Vercel, qui presente le secret
 * en en-tete. Sans ce secret, l'adresse ne repond pas.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!secret || !cle || !url) {
    return NextResponse.json(
      { erreur: "Entretien non configuré sur ce déploiement." },
      { status: 500 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Non autorisé." }, { status: 401 });
  }

  const supabase = createClient(url, cle, { auth: { persistSession: false } });

  const { data: retrogrades, error } = await supabase.rpc(
    "retrograder_abonnements_expires"
  );

  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  /*
   * Le rattrapage est tente a part, et son echec n'emporte pas le reste :
   * la retrogradation ne depend pas de SASPay, et doit continuer de tourner
   * meme quand le prestataire n'est pas configure ou ne repond pas.
   */
  let rapprochement: unknown = { ignore: "saspay_non_configure" };

  if (process.env.SASPAY_SECRET_KEY) {
    try {
      rapprochement = await reconcilierAbonnements();
    } catch (erreur) {
      console.error("entretien abonnements", erreur);
      rapprochement = { erreur: "Rapprochement impossible." };
    }
  }

  return NextResponse.json({ retrogrades, rapprochement });
}
