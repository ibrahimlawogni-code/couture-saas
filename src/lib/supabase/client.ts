import { createBrowserClient } from "@supabase/ssr";

function creer() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

let instance: ReturnType<typeof creer> | null = null;

/**
 * Instance unique et partagee.
 *
 * Creer un client par appel faisait cohabiter plusieurs gestionnaires de
 * session sur le meme cookie. Des qu'ils tentaient de renouveler le jeton en
 * meme temps, l'un recevait un refus, considerait la session invalide, et
 * effacait le cookie : l'utilisateur se retrouvait deconnecte en pleine
 * saisie.
 */
export function createClient() {
  if (!instance) instance = creer();
  return instance;
}
