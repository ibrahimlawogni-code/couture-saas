/**
 * Faut-il rejouer ce qu'un defaut de droit avait fait echouer ?
 *
 * Isole du magasin pour etre eprouve : ce predicat a deja mange une saisie
 * en silence. Il ne retenait que SIGNED_IN et TOKEN_REFRESHED, alors que la
 * bibliotheque emet INITIAL_SESSION quand elle restaure au chargement de la
 * page une session deja ouverte. Une saisie refusee pour session expiree
 * affichait donc « reconnectez-vous, la saisie repartira d'elle-meme », et
 * revenir avec une session valable n'emettait rien qui la relance : le
 * conseil ne pouvait pas etre suivi, et l'operation restait refusee.
 *
 * La session est exigee parce qu'INITIAL_SESSION est aussi emis avec null
 * quand personne n'est connecte. Rejouer la file a ce moment-la ferait
 * echouer les operations une fois de plus et consommerait pour rien les
 * reprises que l'outbox leur compte.
 */
const EVENEMENTS_AVEC_DROIT = new Set([
  // Session deja ouverte, restauree au chargement de la page.
  "INITIAL_SESSION",
  // Reconnexion manuelle.
  "SIGNED_IN",
  // Rafraichissement automatique du jeton.
  "TOKEN_REFRESHED",
]);

export function sessionRetrouvee(
  evenement: string,
  session: unknown
): boolean {
  return Boolean(session) && EVENEMENTS_AVEC_DROIT.has(evenement);
}
