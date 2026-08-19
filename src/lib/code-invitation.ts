/**
 * Report du code d'invitation a travers le detour par le fournisseur.
 *
 * Un apprenti arrive par un lien qui porte son code. S'il choisit Google, il
 * quitte le site et revient sur /auth/callback sans rien de ce qu'il avait
 * sous les yeux : le code est perdu, et il ouvrirait un atelier vide au lieu
 * de rejoindre celui de son patron. Il est donc depose avant le depart, et
 * relu par l'ecran de bienvenue au retour.
 *
 * sessionStorage plutot que localStorage : un code oublie la ne doit pas
 * rattacher a un atelier quelqu'un qui s'inscrirait depuis le meme
 * navigateur trois semaines plus tard.
 *
 * Tout est enveloppe : navigation privee et stockage refuse existent, et
 * l'ecran de bienvenue sait demander le code lui-meme. Perdre ce report est
 * une gene, jamais une impasse.
 */
const CLE = "code-invitation";

export function deposerCode(code: string) {
  if (!code) return;
  try {
    sessionStorage.setItem(CLE, code);
  } catch {
    // Sans stockage, l'ecran de bienvenue demandera le code.
  }
}

export function reprendreCode(): string {
  try {
    return sessionStorage.getItem(CLE) ?? "";
  } catch {
    return "";
  }
}

/*
 * Rien n'efface le code volontairement : sessionStorage meurt avec
 * l'onglet, ce qui est exactement la duree de vie voulue. Un code qui
 * resterait le temps d'une seconde inscription dans le meme onglet aurait
 * de toute facon deja ete consomme, et la base le refuserait en le disant.
 */
