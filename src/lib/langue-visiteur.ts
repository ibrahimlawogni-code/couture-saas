import { cookies, headers } from "next/headers";
import { LANGUES, LANGUE_PAR_DEFAUT, estLangue, type Langue } from "./i18n";

/*
 * La langue de quelqu'un qui n'est pas encore connecte.
 *
 * Les ecrans d'acces et la page de vente se lisent avant toute session : il
 * n'y a pas d'atelier dont lire la langue, et pourtant un tailleur
 * anglophone qui tombe sur une page de connexion qu'il ne lit pas s'en va
 * avant d'avoir vu le produit.
 *
 * Deux sources, dans cet ordre.
 *
 * Le choix explicite d'abord, garde dans un cookie. Il l'emporte toujours :
 * quelqu'un qui a designe sa langue ne doit pas se la voir reprendre a
 * chaque visite.
 *
 * L'en-tete du navigateur ensuite, comme premiere supposition seulement.
 * Elle se trompe souvent ici - un Android vendu au Benin est frequemment
 * configure en anglais alors que son proprietaire travaille en francais -
 * d'ou le selecteur qui permet de la corriger, et le cookie qui retient la
 * correction.
 *
 * Un cookie et non le stockage local : il est lu sur le serveur, donc la
 * page arrive deja dans la bonne langue. Le stockage local imposerait un
 * rendu francais suivi d'un changement sous les yeux du visiteur.
 */

export const COOKIE_LANGUE = "langue";

/** Un an : le choix d'une langue n'a pas de raison d'etre repose souvent. */
export const DUREE_COOKIE_LANGUE = 60 * 60 * 24 * 365;

/**
 * Premiere langue servie que le navigateur declare accepter.
 *
 * L'en-tete est une liste ponderee - « en-GB,en;q=0.9,fr;q=0.8 ». On la
 * lit dans l'ordre plutot que de trier sur q : les navigateurs l'emettent
 * deja par preference decroissante, et un tri complet ferait beaucoup de
 * code pour un resultat identique.
 */
function langueDuNavigateur(entete: string | null): Langue | null {
  if (!entete) return null;

  for (const morceau of entete.split(",")) {
    const code = morceau.split(";")[0]?.trim().slice(0, 2).toLowerCase();
    if (estLangue(code)) return code;
  }

  return null;
}

export async function langueVisiteur(): Promise<Langue> {
  const choix = (await cookies()).get(COOKIE_LANGUE)?.value;
  if (estLangue(choix)) return choix;

  const acceptees = (await headers()).get("accept-language");
  return langueDuNavigateur(acceptees) ?? LANGUE_PAR_DEFAUT;
}

/** Les langues proposees, pour peupler le selecteur. */
export const LANGUES_PROPOSEES = LANGUES;
