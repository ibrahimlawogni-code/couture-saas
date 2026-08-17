/**
 * Concatene des classes en ignorant ce qui est absent.
 *
 * Volontairement minuscule : les composants d'ici acceptent une prop
 * `classe` pour les ajustements de mise en page, et il fallait un moyen de
 * la fondre dans les classes de base sans trainer une dependance.
 *
 * Aucune fusion de conflits : c'est a l'appelant de ne pas passer une
 * classe que le composant pose deja.
 */
export function classes(...valeurs: (string | false | null | undefined)[]) {
  return valeurs.filter(Boolean).join(" ");
}
