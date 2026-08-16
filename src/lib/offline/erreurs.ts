/**
 * Un refus de la base n'est pas une panne de reseau.
 *
 * La file locale existe pour rejouer ce que le reseau a empeche de partir.
 * Y ranger une ecriture que Postgres refuse par principe, une limite
 * d'offre atteinte par exemple, la ferait echouer a chaque tentative et
 * bloquerait tout ce qui attend derriere elle. Ces refus doivent donc
 * remonter tout de suite a la personne qui saisit.
 */

// 22 valeur invalide, 23 contrainte violee, 42 droit ou syntaxe,
// P0001 exception levee par un declencheur. Aucun de ces cas ne se
// resout en reessayant plus tard.
const CODES_DEFINITIFS = /^(22|23|42|P0)/;

export function estRefusDefinitif(erreur: unknown): boolean {
  const code = (erreur as { code?: string } | null)?.code;
  return typeof code === "string" && CODES_DEFINITIFS.test(code);
}

const MESSAGES: { motif: RegExp; message: string }[] = [
  {
    motif: /limite_clients_atteinte/,
    message:
      "L'offre Découverte s'arrête à 5 clients. Passez à l'offre Atelier pour continuer à en ajouter.",
  },
  {
    motif: /limite_commandes_atteinte/,
    message:
      "L'offre Découverte s'arrête à 5 commandes en cours. Marquez une commande comme livrée, ou passez à l'offre Atelier.",
  },
  {
    motif: /atelier_complet/,
    message:
      "Votre offre ne permet pas d'ajouter un compte supplémentaire à cet atelier.",
  },
];

export function messageRefus(erreur: unknown): string {
  const brut = String((erreur as { message?: string } | null)?.message ?? "");
  const trouve = MESSAGES.find((entree) => entree.motif.test(brut));

  return (
    trouve?.message ??
    "L'enregistrement a été refusé. Réessayez, et contactez-nous si cela persiste."
  );
}

/** Vrai si le refus vient d'une limite d'offre, donc levable en changeant d'offre. */
export function estLimiteOffre(erreur: unknown): boolean {
  return /limite_clients_atteinte|limite_commandes_atteinte|atelier_complet/.test(
    String((erreur as { message?: string } | null)?.message ?? "")
  );
}
