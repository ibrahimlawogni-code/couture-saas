import { NextResponse, type NextRequest } from "next/server";
import { reconcilierAbonnements } from "@/lib/abonnement";
import { verifierSignature } from "@/lib/saspay";

/**
 * Notification de SASPay : un paiement a change d'etat.
 *
 * Le corps n'est pas cru sur parole, et n'est meme pas lu au-dela de son
 * type d'evenement. Il ne porte pas les metadonnees de la session, donc
 * rien qui dise a quel atelier crediter ; il ne sert que de signal pour
 * aller relire les sessions chez SASPay, ou l'information se trouve.
 *
 * La signature est verifiee malgre tout. La reconciliation ne fait
 * qu'interroger SASPay, elle ne pourrait rien creer de faux - mais une
 * adresse publique qui declenche des appels sortants a chaque requete
 * s'epuise vite si quelqu'un s'en amuse.
 */
export async function POST(request: NextRequest) {
  // Le corps brut, avant tout analyse : la signature couvre les octets
  // recus, et un aller-retour par JSON.parse puis JSON.stringify les
  // reordonnerait, invalidant une signature pourtant legitime.
  const corps = await request.text();

  const valable = verifierSignature({
    corps,
    signature: request.headers.get("x-webhook-signature"),
    horodatage: request.headers.get("x-webhook-timestamp"),
  });

  if (!valable) {
    return NextResponse.json({ erreur: "Signature invalide." }, { status: 401 });
  }

  const evenement = request.headers.get("x-webhook-event") ?? "";

  /*
   * SASPay envoie treize types d'evenements - reglements, transferts de
   * portefeuille, test. Un seul nous concerne. Les autres recoivent 200 :
   * repondre en erreur ferait reessayer le prestataire pour un evenement
   * qu'on ne traitera jamais.
   */
  if (evenement !== "transaction.success") {
    return NextResponse.json({ ignore: evenement });
  }

  try {
    const bilan = await reconcilierAbonnements();
    return NextResponse.json(bilan);
  } catch (erreur) {
    /*
     * 500 volontaire : SASPay reessaiera. Une panne de notre cote ne doit
     * pas faire disparaitre un paiement, et l'entretien nocturne repasse
     * de toute facon derriere.
     */
    console.error("reconciliation abonnements", erreur);
    return NextResponse.json({ erreur: "Rapprochement impossible." }, { status: 500 });
  }
}
