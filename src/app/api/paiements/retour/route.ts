import { NextResponse, type NextRequest } from "next/server";
import { reconcilierAbonnements } from "@/lib/abonnement";

/**
 * Retour du navigateur apres un paiement.
 *
 * Le rapprochement est lance avant de rendre la main, pour que les reglages
 * affichent deja la nouvelle offre. Sans cela, la personne reviendrait sur
 * un ecran annoncant encore l'offre gratuite, quelques secondes apres avoir
 * paye - et rappellerait.
 *
 * C'est une route et non un ecran : elle a un effet, et un effet n'a pas sa
 * place dans le rendu d'une page.
 *
 * Rien n'est cru sur parole ici non plus. La route ne lit aucun parametre
 * pour decider quoi crediter ; elle declenche le meme rapprochement que la
 * notification, qui va relire les sessions reglees chez SASPay. Quelqu'un
 * qui appellerait cette adresse a la main ne ferait qu'avancer le travail
 * de la nuit.
 */
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);

  try {
    const bilan = await reconcilierAbonnements();

    return NextResponse.redirect(
      `${origin}/reglages?paiement=${bilan.creditees > 0 ? "regle" : "attente"}`
    );
  } catch (erreur) {
    /*
     * L'echec n'est pas annonce comme une perte d'argent, parce que c'en
     * serait rarement une : le versement est chez SASPay, et l'entretien
     * nocturne le rattrapera. On le dit en ces termes.
     */
    console.error("retour paiement", erreur);
    return NextResponse.redirect(`${origin}/reglages?paiement=attente`);
  }
}
