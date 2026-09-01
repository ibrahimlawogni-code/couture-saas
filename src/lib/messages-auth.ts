import { traduire } from "./i18n";

/**
 * Supabase renvoie ses erreurs en anglais et dans son propre vocabulaire.
 * Un tailleur n'a pas a lire "Error sending confirmation email" : il a
 * besoin de savoir ce qui s'est passe et quoi faire ensuite.
 *
 * Ce fichier garde les motifs qui reconnaissent chaque cas ; les phrases
 * vivent dans le dictionnaire, ou elles existent en deux langues. Une
 * expression reguliere ne se traduit pas - elle lit l'anglais de Supabase,
 * qui ne change pas - mais la phrase qu'elle declenche, si.
 */
type CleErreur = keyof ReturnType<typeof traduire>["acces"]["erreurs"];

const MOTIFS: { motif: RegExp; cle: CleErreur }[] = [
  { motif: /code_invitation_invalide/i, cle: "code_invitation" },
  { motif: /atelier_complet/i, cle: "atelier_complet" },
  {
    motif: /error sending confirmation email|error sending email/i,
    cle: "envoi_email",
  },
  {
    motif: /email rate limit exceeded|over_email_send_rate_limit/i,
    cle: "trop_de_tentatives",
  },
  {
    motif: /user already registered|already been registered/i,
    cle: "deja_inscrit",
  },
  {
    /*
     * Supabase repond la meme chose pour un mot de passe faux et pour une
     * adresse jamais confirmee. Le message doit donc citer les deux causes,
     * sinon quelqu'un qui vient de creer son atelier s'entend dire que son
     * mot de passe est faux alors qu'il est bon.
     */
    motif: /invalid login credentials|invalid_credentials/i,
    cle: "identifiants",
  },
  { motif: /password should be at least/i, cle: "mot_de_passe_court" },
  { motif: /invalid format|email address.*invalid/i, cle: "email_invalide" },
  { motif: /email not confirmed/i, cle: "email_non_confirme" },
];

/**
 * Le message a montrer, dans la langue demandee.
 *
 * La langue est facultative : plusieurs actions serveur composent ce
 * message avant de rediriger, et toutes n'ont pas encore de langue sous la
 * main. Sans elle, le francais - qui est le comportement d'avant.
 */
export function messageAuth(brut: string, langue?: unknown): string {
  const trouve = MOTIFS.find((entree) => entree.motif.test(brut));
  return traduire(langue).acces.erreurs[trouve?.cle ?? "inconnue"];
}

/**
 * Vrai quand renvoyer le lien de confirmation peut debloquer la situation.
 *
 * A tester sur l'erreur brute de Supabase, jamais sur le message traduit.
 * La page de connexion cherchait « confirmation » dans le texte francais,
 * qui dit « confirmée » : le lien de secours ne s'affichait donc jamais
 * pour le cas meme qui l'avait fait ecrire. Depuis que le message existe en
 * deux langues, s'appuyer sur son texte serait doublement faux.
 *
 * Les identifiants invalides en font partie : Supabase repond la meme
 * chose pour un mot de passe faux et pour une adresse jamais confirmee.
 */
export function meriteRenvoiConfirmation(brut: string): boolean {
  return /email not confirmed|email_not_confirmed|invalid login credentials|invalid_credentials/i.test(
    brut
  );
}
