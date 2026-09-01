"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { estLangue } from "@/lib/i18n";
import { COOKIE_LANGUE, DUREE_COOKIE_LANGUE } from "@/lib/langue-visiteur";

/**
 * Retient la langue choisie par un visiteur qui n'a pas encore de compte.
 *
 * Le cookie plutot que le stockage local : le serveur le lit, donc la page
 * revient deja traduite. Le stockage local imposerait un rendu francais
 * suivi d'un changement sous les yeux de la personne.
 *
 * Une valeur inattendue est ignoree sans rien dire. Ce formulaire n'a que
 * deux boutons ; une autre valeur ne peut venir que d'une requete fabriquee
 * a la main, et il n'y a rien a lui repondre.
 */
export async function choisirLangue(formulaire: FormData) {
  const choix = formulaire.get("langue");
  if (!estLangue(choix)) return;

  (await cookies()).set(COOKIE_LANGUE, choix, {
    path: "/",
    maxAge: DUREE_COOKIE_LANGUE,
    sameSite: "lax",
  });

  /*
   * Toute la mise en page est revalidee, et non la seule page courante :
   * le selecteur sert sur plusieurs ecrans, et ceux qu'on visitera ensuite
   * doivent parler la nouvelle langue sans attendre une expiration de
   * cache.
   */
  revalidatePath("/", "layout");
}
