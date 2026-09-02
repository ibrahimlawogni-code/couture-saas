import "server-only";

import { headers } from "next/headers";

/**
 * L'adresse publique du site, telle qu'un lien envoye par courriel ou
 * remis a un prestataire de paiement doit la porter.
 *
 * Quatre sources, dans cet ordre, et chacune rattrape la precedente :
 *
 *   1. l'en-tete Origin de la requete. C'est le cas normal, et le seul
 *      qui soit juste quel que soit le domaine par lequel on est entre.
 *   2. NEXT_PUBLIC_SITE_URL, quand on veut imposer une adresse - le jour
 *      ou un vrai domaine remplacera celui de Vercel, c'est la seule
 *      chose a poser.
 *   3. VERCEL_PROJECT_PRODUCTION_URL, que Vercel renseigne tout seul avec
 *      le domaine de production du projet. Elle suit un renommage de
 *      projet sans que personne ait rien a faire.
 *   4. localhost, pour le developpement.
 *
 * Chaque appelant avait auparavant son propre repli, et les quatre
 * divergeaient : deux pointaient vers « couture-saas.vercel.app » ecrit en
 * dur, qui meurt au premier renommage ; l'inscription retombait sur
 * localhost, donc sur la machine du visiteur ; et l'abonnement sur une
 * chaine vide, ce qui donnait au prestataire de paiement une adresse de
 * retour relative, inutilisable.
 */
export async function origineSite(): Promise<string> {
  const origin = (await headers()).get("origin");
  if (origin) return origin;

  const impose = process.env.NEXT_PUBLIC_SITE_URL;
  if (impose) return impose.replace(/\/$/, "");

  /*
   * Vercel donne le domaine nu, sans protocole. VERCEL_URL existe aussi
   * mais designe le deploiement courant, dont l'adresse change a chaque
   * envoi : un lien de confirmation la portant mourrait au deploiement
   * suivant.
   */
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  return "http://localhost:3000";
}
