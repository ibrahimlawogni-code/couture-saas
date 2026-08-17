/**
 * Supabase renvoie ses erreurs en anglais et dans son propre vocabulaire.
 * Un tailleur n'a pas a lire "Error sending confirmation email" : il a
 * besoin de savoir ce qui s'est passe et quoi faire ensuite.
 */
const TRADUCTIONS: { motif: RegExp; message: string }[] = [
  {
    motif: /code_invitation_invalide/i,
    message:
      "Ce code d'invitation est invalide ou a expiré. Demandez-en un nouveau au propriétaire de l'atelier.",
  },
  {
    motif: /atelier_complet/i,
    message:
      "Cet atelier a atteint son nombre maximum de comptes. Le propriétaire doit libérer une place ou changer de formule.",
  },
  {
    motif: /error sending confirmation email|error sending email/i,
    message:
      "L'email de confirmation n'a pas pu partir. Contactez-nous et nous activerons votre atelier à la main.",
  },
  {
    motif: /email rate limit exceeded|over_email_send_rate_limit/i,
    message:
      "Trop de tentatives d'envoi. Patientez une heure, ou contactez-nous pour que nous activions votre atelier.",
  },
  {
    motif: /user already registered|already been registered/i,
    message:
      "Un compte existe déjà avec cet email. Connectez-vous ou utilisez une autre adresse.",
  },
  {
    /*
     * Supabase repond la meme chose pour un mot de passe faux et pour une
     * adresse jamais confirmee. Le message doit donc citer les deux causes,
     * sinon quelqu'un qui vient de creer son atelier s'entend dire que son
     * mot de passe est faux alors qu'il est bon.
     */
    motif: /invalid login credentials|invalid_credentials/i,
    message:
      "Email ou mot de passe incorrect. Si vous venez de créer votre atelier, ouvrez d'abord le lien de confirmation reçu par email.",
  },
  {
    motif: /password should be at least/i,
    message: "Le mot de passe doit contenir au moins 6 caractères.",
  },
  {
    motif: /invalid format|email address.*invalid/i,
    message: "Cette adresse email n'est pas valide.",
  },
  {
    motif: /email not confirmed/i,
    message:
      "Votre adresse n'est pas encore confirmée. Ouvrez le lien reçu par email, ou contactez-nous.",
  },
];

export function messageAuth(brut: string): string {
  const trouve = TRADUCTIONS.find((t) => t.motif.test(brut));
  return (
    trouve?.message ??
    "L'opération n'a pas abouti. Réessayez, et contactez-nous si cela persiste."
  );
}

/**
 * Vrai quand renvoyer le lien de confirmation peut debloquer la situation.
 *
 * A tester sur l'erreur brute de Supabase, jamais sur le message traduit.
 * La page de connexion cherchait « confirmation » dans le texte francais,
 * qui dit « confirmée » : le lien de secours ne s'affichait donc jamais
 * pour le cas meme qui l'avait fait ecrire.
 *
 * Les identifiants invalides en font partie : Supabase repond la meme
 * chose pour un mot de passe faux et pour une adresse jamais confirmee.
 */
export function meriteRenvoiConfirmation(brut: string): boolean {
  return /email not confirmed|email_not_confirmed|invalid login credentials|invalid_credentials/i.test(
    brut
  );
}
