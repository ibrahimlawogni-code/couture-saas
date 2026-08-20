/*
 * Objets de couture flottant autour du telephone, dans le hero.
 *
 * Dessines dans la geometrie de la marque - trait epais et constant, formes
 * reduites au minimum, une seule couleur heritee du contexte - et non en
 * style mercerie. Le doc d'identite ecarte l'aiguille et la bobine pour le
 * logo, au motif qu'elles rangeraient le produit du cote des fournitures ;
 * la consigne vaut pour la marque, pas pour une illustration de page de
 * vente, ou montrer le metier rapproche au contraire de celui qui le fait.
 * Le trait geometrique est ce qui garde l'ensemble du cote du logiciel.
 *
 * Purement decoratifs, donc aria-hidden : ce que la page a a dire tient
 * dans son titre, pas dans ses bobines. Un lecteur d'ecran n'a rien a
 * gagner a les entendre enumerer.
 *
 * En SVG et non en images : quelques centaines d'octets au lieu de
 * plusieurs centaines de kilo-octets, nets a toute taille, et rien de plus
 * a telecharger sur le telephone d'entree de gamme qui est la cible.
 */

const TRAIT = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/*
 * Bobine vue de profil, en une seule silhouette a la taille pincee.
 *
 * Premiere version : deux montants verticaux et trois fils horizontaux.
 * A quarante pixels, cela ne disait pas « bobine » mais « echelle ». La
 * taille pincee, elle, ne ressemble a rien d'autre.
 */
function Bobine() {
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden>
      <path
        d="M13 8h22v4l-7 5v14l7 5v4H13v-4l7-5V17l-7-5V8z"
        {...TRAIT}
      />
    </svg>
  );
}

function Ciseaux() {
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden>
      <circle cx="15" cy="37" r="6" {...TRAIT} />
      <circle cx="33" cy="37" r="6" {...TRAIT} />
      <path d="M30 8 18 32M18 8l12 24" {...TRAIT} />
    </svg>
  );
}

/*
 * De a coudre : coiffe etroite, bande au bord ouvert, alveoles.
 *
 * La premiere version, large et arrondie avec un seul trait en travers, se
 * lisait comme un cadenas. Ce sont les alveoles qui font le de, et il en
 * faut assez pour qu'on les prenne pour une texture et non pour un visage.
 */
function DeACoudre() {
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden>
      <path d="M16 41V24a8 8 0 0 1 16 0v17z" {...TRAIT} />
      <path d="M16 36h16" {...TRAIT} />
      <circle cx="21" cy="23" r="1.5" fill="currentColor" />
      <circle cx="27" cy="23" r="1.5" fill="currentColor" />
      <circle cx="24" cy="27" r="1.5" fill="currentColor" />
      <circle cx="19" cy="30" r="1.5" fill="currentColor" />
      <circle cx="29" cy="30" r="1.5" fill="currentColor" />
    </svg>
  );
}

function MetreRuban() {
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden>
      <path d="M6 18h36v12H6z" {...TRAIT} />
      <path d="M14 18v6M22 18v8M30 18v6M38 18v8" {...TRAIT} />
    </svg>
  );
}

/*
 * Aiguille enfilee : le corps, le chas, et le fil qui s'echappe.
 *
 * L'arc d'un seul tenant de la premiere version se refermait en boucle et
 * se lisait comme une cle. Le chas separe du fil leve l'ambiguite.
 */
function Aiguille() {
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden>
      <path d="M9 41 29 21" {...TRAIT} />
      <ellipse
        cx="32.5"
        cy="17.5"
        rx="2.6"
        ry="4.6"
        transform="rotate(45 32.5 17.5)"
        {...TRAIT}
      />
      <path d="M36 13c6-2 9 3 6 7" {...TRAIT} />
    </svg>
  );
}

/*
 * Chaque objet porte sa place, sa taille, son inclinaison et son retard.
 *
 * Les retards sont volontairement irreguliers : cales sur la meme phase,
 * cinq objets montant et descendant ensemble donneraient une respiration
 * mecanique plutot qu'un flottement.
 *
 * « discret » retire l'objet sur les petits ecrans. A 390 px, le telephone
 * occupe deja presque toute la largeur, et cinq objets autour ne feraient
 * plus de la profondeur mais de l'encombrement.
 */
const OBJETS = [
  {
    cle: "bobine",
    Forme: Bobine,
    place: "left-0 top-6 sm:top-10",
    taille: "size-11 sm:size-14",
    teinte: "text-vert-pale/55",
    inclinaison: "-12deg",
    retard: "0s",
    discret: false,
  },
  {
    cle: "ciseaux",
    Forme: Ciseaux,
    place: "right-1 top-0 sm:right-4",
    taille: "size-12 sm:size-16",
    teinte: "text-white/35",
    inclinaison: "14deg",
    retard: "1.4s",
    discret: false,
  },
  {
    cle: "de",
    Forme: DeACoudre,
    place: "bottom-16 left-0 sm:bottom-24",
    taille: "size-12 sm:size-14",
    teinte: "text-white/35",
    inclinaison: "8deg",
    retard: "2.8s",
    discret: true,
  },
  {
    cle: "ruban",
    Forme: MetreRuban,
    place: "bottom-2 right-0 sm:bottom-6",
    taille: "size-14 sm:size-20",
    teinte: "text-vert-pale/45",
    inclinaison: "-18deg",
    retard: "0.7s",
    discret: true,
  },
  {
    cle: "aiguille",
    Forme: Aiguille,
    place: "right-2 top-1/2 sm:right-0",
    taille: "size-10 sm:size-12",
    teinte: "text-vert-pale/40",
    inclinaison: "22deg",
    retard: "3.5s",
    discret: true,
  },
] as const;

export function ObjetsCouture() {
  return (
    // pointer-events-none : rien ici n'est cliquable, et un objet pose
    // par-dessus la capture ne doit pas intercepter le doigt.
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {OBJETS.map(({ cle, Forme, place, taille, teinte, inclinaison, retard, discret }) => (
        <span
          key={cle}
          style={{ animationDelay: retard }}
          className={`flotte absolute ${place} ${taille} ${teinte} ${
            discret ? "hidden sm:block" : ""
          }`}
        >
          <span className="block size-full" style={{ rotate: inclinaison }}>
            <Forme />
          </span>
        </span>
      ))}
    </div>
  );
}
