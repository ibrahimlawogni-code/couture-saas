/**
 * Marque TailorHub : un bouton de couture.
 *
 * C'est la seule des pistes dessinees qui restait lisible a 20 px, taille a
 * laquelle un logo passe l'essentiel de sa vie. Elle herite de la couleur
 * courante, ce qui la rend utilisable sur clair comme sur sombre.
 */
export function Marque({ taille = 32 }: { taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="18" cy="18" r="3.2" fill="currentColor" />
      <circle cx="30" cy="18" r="3.2" fill="currentColor" />
      <circle cx="18" cy="30" r="3.2" fill="currentColor" />
      <circle cx="30" cy="30" r="3.2" fill="currentColor" />
    </svg>
  );
}
