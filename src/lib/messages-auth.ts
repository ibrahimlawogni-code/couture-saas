/**
 * Supabase renvoie ses erreurs en anglais et dans son propre vocabulaire.
 * Un tailleur n'a pas a lire "Error sending confirmation email" : il a
 * besoin de savoir ce qui s'est passe et quoi faire ensuite.
 */
const TRADUCTIONS: { motif: RegExp; message: string }[] = [
  {
    motif: /error sending confirmation email|error sending email/i,
    message:
      "L'email de confirmation n'a pas pu partir. Contacte-nous et nous activerons ton atelier à la main.",
  },
  {
    motif: /email rate limit exceeded|over_email_send_rate_limit/i,
    message:
      "Trop de tentatives d'envoi. Patiente une heure, ou contacte-nous pour qu'on active ton atelier.",
  },
  {
    motif: /user already registered|already been registered/i,
    message:
      "Un compte existe déjà avec cet email. Connecte-toi ou utilise une autre adresse.",
  },
  {
    motif: /invalid login credentials/i,
    message: "Email ou mot de passe incorrect.",
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
      "Ton adresse n'est pas encore confirmée. Ouvre le lien reçu par email, ou contacte-nous.",
  },
];

export function messageAuth(brut: string): string {
  const trouve = TRADUCTIONS.find((t) => t.motif.test(brut));
  return (
    trouve?.message ??
    "L'opération n'a pas abouti. Réessaie, et contacte-nous si cela persiste."
  );
}
