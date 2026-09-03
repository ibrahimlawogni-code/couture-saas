/**
 * Marque TailorHub : un bouton de couture.
 *
 * C'est la seule des pistes dessinees qui restait lisible a 20 px, taille a
 * laquelle un logo passe l'essentiel de sa vie.
 *
 * Le bouton est plein, et ses quatre trous sont *evides* plutot que peints
 * en blanc : un seul trace, et la regle evenodd creuse les cercles
 * interieurs. Le fond passe donc au travers.
 *
 * C'est ce qui permet de n'avoir qu'une seule marque. Sur fond clair, en
 * vert, elle donne un bouton vert a trous blancs ; sur les panneaux foret,
 * en blanc, un bouton blanc a trous verts. Des trous peints en blanc
 * auraient donne la-bas un bouton blanc tache de blanc, illisible.
 *
 * Elle herite de la couleur courante : c'est l'ecran qui decide, selon le
 * fond sur lequel il la pose.
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
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 2.5a21.5 21.5 0 100 43 21.5 21.5 0 000-43zM18 14a4 4 0 100 8 4 4 0 000-8zM30 14a4 4 0 100 8 4 4 0 000-8zM18 26a4 4 0 100 8 4 4 0 000-8zM30 26a4 4 0 100 8 4 4 0 000-8z"
      />
    </svg>
  );
}
