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

/*
 * Sauf 42501, le refus de droit.
 *
 * C'est le code que renvoie une politique RLS, et donc aussi celui que
 * renvoie une session dont le jeton a expire sans avoir pu se
 * rafraichir - le cas exact d'un atelier reste plusieurs jours hors
 * reseau. Le classer parmi les refus definitifs faisait jeter une saisie
 * qu'une simple reconnexion aurait sauvee.
 *
 * Une vraie violation de droit ne passe pas pour autant : elle ne trouve
 * ici qu'un sursis, echoue a chacune des cinq tentatives, puis la file la
 * marque d'elle-meme.
 */
const CODE_DROIT_REFUSE = "42501";

export function estRefusDefinitif(erreur: unknown): boolean {
  const code = (erreur as { code?: string } | null)?.code;

  if (typeof code !== "string") return false;
  if (code === CODE_DROIT_REFUSE) return false;

  return CODES_DEFINITIFS.test(code);
}

/**
 * Vrai si le refus tient au droit, donc le plus souvent a une session
 * perdue. C'est le seul echec qu'une reconnexion peut lever, et donc le
 * seul qu'on accepte de rejouer.
 */
export function estRefusDeDroit(erreur: unknown): boolean {
  return (erreur as { code?: string } | null)?.code === CODE_DROIT_REFUSE;
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
  /*
   * Refus de droit, apres cinq tentatives infructueuses. La cause la plus
   * frequente n'est pas un droit manquant mais une session perdue, et la
   * personne n'a aucun moyen de le deviner.
   *
   * La reprise annoncee est reelle : ces operations sont marquees
   * rejouables, et une reconnexion les remet dans la file. Rien n'est
   * donc a ressaisir, et surtout rien n'est a retirer - d'ou une
   * formulation qui dit d'attendre plutot que d'agir.
   */
  {
    motif: /row-level security|JWT|not authenticated|invalid token/i,
    message:
      "Votre session a expiré avant l'envoi. Reconnectez-vous : la saisie repartira d'elle-même.",
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
