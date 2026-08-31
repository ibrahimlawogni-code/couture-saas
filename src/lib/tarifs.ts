/**
 * Prix mensuel de chaque offre, en francs CFA.
 *
 * Cette table fait autorite pour l'encaissement. Le navigateur n'envoie
 * jamais de montant : il ne designe qu'une offre, et c'est le serveur qui
 * lit ici ce qu'elle coute. Accepter un montant venu du client reviendrait
 * a laisser n'importe qui s'offrir Atelier Pro pour un franc en modifiant
 * la requete.
 *
 * La page de vente affiche ces memes sommes, ecrites separement. C'est une
 * duplication assumee : elle y sert d'argumentaire, ici de reference de
 * paiement. Si les prix changent, les deux endroits sont a reprendre.
 */
export const TARIFS: Record<string, { nom: string; parMois: number }> = {
  atelier: { nom: "Atelier", parMois: 3500 },
  atelier_pro: { nom: "Atelier Pro", parMois: 5000 },
};

/** Offres payantes, dans l'ordre ou on les propose. */
export const OFFRES_PAYANTES = ["atelier", "atelier_pro"] as const;

export type OffrePayante = (typeof OFFRES_PAYANTES)[number];

export function estOffrePayante(code: string): code is OffrePayante {
  return (OFFRES_PAYANTES as readonly string[]).includes(code);
}
