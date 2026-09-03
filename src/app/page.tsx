import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Ruler,
  WifiSlash,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Marque } from "./marque";

// Adresse professionnelle, hebergee sur le domaine colossalebusiness.fr.
const WHATSAPP = "2290197970999";
const EMAIL = "support@colossalebusiness.fr";

const lienWhatsApp = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Bonjour, je suis tailleur et je voudrais essayer TailorHub."
)}`;

export const metadata: Metadata = {
  title: "TailorHub, le carnet numérique de votre atelier de couture",
  description:
    "Gardez les mesures de vos clients, suivez vos commandes et vos acomptes, envoyez reçus et rappels par WhatsApp. Fonctionne même sans connexion.",
};

/*
 * Les formes viennent des tokens partages avec l'application, et non d'un
 * systeme propre a cette page : controle pour ce qu'on actionne, carte pour
 * les surfaces internes, panneau pour les grandes. Une page de vente qui
 * n'arrondit pas comme le produit qu'elle vend se trahit des le premier
 * ecran passe apres l'inscription.
 *
 * Les rayons plus larges - le cadre du hero, le telephone, la photo - n'ont
 * pas de token : ils n'existent qu'ici, et inventer un quatrieme niveau pour
 * trois usages de vitrine polluerait l'echelle du produit.
 */

/*
 * L'offre mise en avant. C'etait une propriete reglable dans la maquette ;
 * ici une constante, parce qu'un changement d'offre vedette est une decision
 * commerciale qui merite un commit, pas un reglage discret.
 */
const FORMULE_MISE_EN_AVANT = "Atelier Pro";

/* --------------------------------------------------------------------- */
/* Donnees de demonstration                                              */
/*                                                                       */
/* Rien ici n'est branche : ce sont des exemples de vitrine. Ils restent  */
/* en haut du fichier plutot que noyes dans le balisage, pour qu'une      */
/* correction de nom ou de montant se fasse sans relire une maquette.     */
/* --------------------------------------------------------------------- */

/*
 * Sept jalons, un par etape de Recu a Livre. Celui de l'etape courante
 * s'allonge : c'est ce qui permet de situer une commande d'un coup d'oeil,
 * sans compter les points.
 */
function jalons(courante: number) {
  return Array.from({ length: 7 }, (_, n) => {
    if (n < courante) return { largeur: "0.3125rem", fond: "bg-vert" };
    if (n === courante) return { largeur: "0.8125rem", fond: "bg-foret" };
    return { largeur: "0.3125rem", fond: "bg-bordure" };
  });
}

const APERCU = [
  {
    client: "Koffi Ahossi",
    modele: "Costume deux pièces",
    etiquette: "En retard · 23/08",
    etiquetteClasse: "bg-rouge-clair text-rouge",
    reste: "reste 38 000",
    resteClasse: "text-rouge",
    jalons: jalons(4),
    suivant: "Prêt",
  },
  {
    client: "Adjoa Sossou",
    modele: "Ensemble pagne",
    etiquette: "Aujourd'hui",
    etiquetteClasse: "bg-ambre-clair text-ambre",
    reste: "soldé",
    resteClasse: "text-vert",
    jalons: jalons(5),
    suivant: "Livré",
  },
  {
    client: "Mensah Dossou",
    modele: "Chemise en bazin",
    etiquette: "Aujourd'hui",
    etiquetteClasse: "bg-ambre-clair text-ambre",
    reste: "reste 12 000",
    resteClasse: "text-rouge",
    jalons: jalons(3),
    suivant: "Finitions",
  },
];

/*
 * Rampe de six verts pour la barre des etapes. Elle n'entre pas dans les
 * tokens : ce n'est pas une couleur qui veut dire quelque chose, c'est une
 * progression. Les tokens portent un sens - vert le metier, rouge un
 * probleme, bleu le systeme - et une nuance intermediaire n'en porte aucun.
 */
const RAMPE = ["#dcede5", "#bfdfd0", "#9fcfba", "#6fb397", "#3f9375", "#12684e"];
const COMPTES = [2, 3, 4, 1, 1, 2];
const TOTAL = COMPTES.reduce((a, b) => a + b, 0);

const SEGMENTS = ["Reçu", "Coupe", "Couture", "Essayage", "Finitions", "Prêt"].map(
  (label, n) => ({
    label,
    nombre: COMPTES[n],
    part: `${(COMPTES[n] / TOTAL) * 100}%`,
    fond: RAMPE[n],
  })
);

const MESURES = [
  { nom: "Épaules", valeur: "44" },
  { nom: "Poitrine", valeur: "102" },
  { nom: "Taille", valeur: "88" },
  { nom: "Manche", valeur: "62" },
  { nom: "Bassin", valeur: "104" },
  { nom: "Longueur", valeur: "76" },
];

const IMPAYES = [
  { client: "Sylvain Hounkpatin", age: "12 j", montant: "50 000" },
  { client: "Koffi Ahossi", age: "2 j de retard", montant: "38 000" },
  { client: "Rachidatou Bio Tchané", age: "en cours", montant: "26 000" },
];

const OFFRES = [
  {
    nom: "Découverte",
    prix: "Gratuit",
    unite: "sans limite de durée",
    pour: "Pour essayer sur de vraies commandes",
    cta: "Commencer",
    avantages: [
      "5 clients",
      "5 commandes en cours",
      "Mesures et acomptes",
      "Reçus et rappels WhatsApp",
    ],
  },
  {
    nom: "Atelier",
    prix: "3 500",
    unite: "FCFA par mois",
    pour: "Pour le tailleur qui travaille seul",
    cta: "Choisir Atelier",
    avantages: [
      "Clients et commandes sans limite",
      "Bilan financier du mois",
      "Fonctionne sans connexion",
      "Sans engagement",
    ],
  },
  {
    nom: "Atelier Pro",
    prix: "5 000",
    unite: "FCFA par mois",
    pour: "Pour un atelier avec des apprentis",
    cta: "Choisir Atelier Pro",
    avantages: [
      "Tout ce que contient Atelier",
      "Jusqu'à 5 apprentis sur le même atelier",
      "Chacun son compte, ses commandes visibles",
      "Assistance WhatsApp sous 24 h",
    ],
  },
];

const QUESTIONS = [
  {
    q: "Faut-il savoir se servir d'un ordinateur ?",
    r: "Non. TailorHub s'utilise sur le téléphone, avec de gros boutons et des écrans simples. Si vous savez envoyer un message WhatsApp, vous saurez vous en servir.",
  },
  {
    q: "Et si je n'ai pas de connexion à l'atelier ?",
    r: "Vous pouvez quand même enregistrer un client, ses mesures et une commande. Tout part automatiquement dès que le réseau revient, et l'application vous dit à chaque instant ce qui est encore sur l'appareil.",
  },
  {
    q: "Mes clients doivent-ils installer quelque chose ?",
    r: "Non. Ils reçoivent vos reçus et vos rappels sur WhatsApp, comme un message normal.",
  },
  {
    q: "Puis-je travailler avec mes apprentis ?",
    r: "Oui, avec l'offre Atelier Pro : jusqu'à cinq comptes sur le même atelier, chacun voit les commandes qui le concernent.",
  },
  {
    q: "Que deviennent mes données si j'arrête ?",
    r: "Elles vous appartiennent. Vous pouvez demander une copie de vos clients et de vos commandes à tout moment.",
  },
];

/* --------------------------------------------------------------------- */

function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-bordure bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-5">
        {/* La marque accompagne le nom, comme dans la barre laterale et
            l'en-tete du telephone : c'est la meme identite des l'accueil. */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-controle text-encre sm:gap-2.5"
        >
          <span className="text-vert">
            <Marque taille={26} />
          </span>
          <span className="text-base font-semibold tracking-tight sm:text-lg">
            TailorHub
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Les ancres disparaissent sous 1024 px : a cette largeur elles
              volent la place des deux liens qui comptent vraiment. */}
          <a
            href="#tarifs"
            className="hidden rounded-controle px-3 py-2 text-sm font-medium text-gris transition-colors hover:text-encre lg:inline-block"
          >
            Tarifs
          </a>
          <a
            href="#questions"
            className="hidden rounded-controle px-3 py-2 text-sm font-medium text-gris transition-colors hover:text-encre lg:inline-block"
          >
            Questions
          </a>
          <Link
            href="/login"
            className="rounded-controle px-2 py-2 text-sm font-medium whitespace-nowrap text-gris transition-colors hover:text-encre sm:px-3"
          >
            Se connecter
          </Link>
          {/*
           * Le libelle raccourcit sur telephone plutot que de passer a la
           * ligne. A 390 px, « Essayer gratuitement » en entier poussait la
           * barre au-dela de sa hauteur et cassait les deux liens en deux
           * lignes chacun. Se connecter reste visible : c'est le seul acces
           * a l'application pour qui a deja un atelier.
           */}
          <Link
            href="/signup"
            className="rounded-controle bg-foret px-3 py-2.5 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-vert active:translate-y-px sm:px-4"
          >
            <span className="sm:hidden">Essayer</span>
            <span className="hidden sm:inline">Essayer gratuitement</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* Une ligne du recu : libelle a gauche, valeur a droite. */
function Ligne({
  libelle,
  valeur,
  fort = false,
}: {
  libelle: string;
  valeur: string;
  fort?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-gris">{libelle}</span>
      <span className={`truncate text-encre ${fort ? "font-semibold" : ""}`}>
        {valeur}
      </span>
    </div>
  );
}

/*
 * Le boitier qui tient l'apercu, legerement penche.
 *
 * L'apercu etait un rectangle arrondi pose a plat : on y lisait une
 * interface, pas un telephone. Le boitier le dit d'un coup d'oeil, et c'est
 * ce qu'il faut dire ici - le produit s'utilise debout dans un atelier, pas
 * devant un ordinateur.
 *
 * L'inclinaison reste faible, trois degres et demi. Au-dela, le texte de
 * l'ecran devient penible a lire et l'apercu cesse de montrer ce qu'il est
 * venu montrer.
 *
 * Le pivot est en bas a droite : l'ecran s'ecarte du texte au lieu de venir
 * vers lui, et rien ne mord sur la colonne voisine.
 *
 * Separe de l'apercu, et non enroule autour de lui : l'un dessine une
 * application, l'autre un objet. Les melanger ferait un composant qui change
 * pour deux raisons.
 */
function Boitier({ children }: { children: React.ReactNode }) {
  return (
    <div className="origin-bottom-right rotate-[-3.5deg]">
      <div className="rounded-[2.25rem] bg-encre p-2.5 pt-3 shadow-[0_1.5rem_3.75rem_-1.25rem_rgb(0_0_0/0.55)] ring-1 ring-white/10">
        {/* Le haut-parleur : deux pixels qui suffisent a faire un telephone. */}
        <span
          aria-hidden
          className="mx-auto mb-2.5 block h-1 w-12 rounded-full bg-white/25"
        />
        {children}
      </div>
    </div>
  );
}

/*
 * L'apercu du produit dans le hero.
 *
 * C'etait une capture PNG. C'est maintenant du balisage : quelques
 * kilo-octets au lieu de plusieurs centaines, net a toutes les densites
 * d'ecran, et surtout jamais perime - une capture montre l'application du
 * jour ou on l'a prise.
 *
 * role="img" avec un libelle : sans lui, un lecteur d'ecran deroulerait
 * trois noms de clients et sept jalons comme s'il s'agissait du contenu de
 * la page. Le libelle dit ce que l'image montre, et le detail est saute.
 */
function ApercuTelephone() {
  return (
    <div
      role="img"
      aria-label="L'écran d'accueil de TailorHub sur un téléphone : trois pièces à livrer aujourd'hui, dont deux en retard, et la liste des commandes avec leur étape."
      className="w-[17.5rem] max-w-full overflow-hidden rounded-[1.5rem] bg-papier text-encre"
    >
      <div className="flex items-center justify-between border-b border-bordure bg-white px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-vert">
          <Marque taille={20} />
          <span className="text-[0.8125rem] font-semibold text-encre">
            Atelier Sossou
          </span>
        </span>
        <span className="text-[0.6875rem] text-gris">14:32</span>
      </div>

      {/* Le bleu ne decore pas : il dit que c'est l'application qui parle. */}
      <div className="flex items-center gap-2 bg-bleu-clair px-3.5 py-1.5">
        <span className="size-1.5 rounded-full bg-bleu" />
        <span className="text-[0.6875rem] font-medium text-bleu">
          Hors connexion · 2 fiches sur l&apos;appareil
        </span>
      </div>

      <div className="p-3">
        <div className="rounded-[1.125rem] bg-foret p-4 text-white">
          <div className="text-[0.6875rem] text-vert-pale">
            Bonjour · mardi 25 août
          </div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            {/* Chiffre isole : chasse proportionnelle, la chasse fixe
                donnerait a un « 3 » la largeur d'un zero. */}
            <span className="text-[2.75rem] leading-[0.85] font-semibold tracking-tight">
              3
            </span>
            <span className="max-w-[7.5rem] text-[0.8125rem] leading-tight font-medium">
              pièces à livrer aujourd&apos;hui
            </span>
          </div>
          <div className="mt-3 flex gap-1.5">
            <span className="rounded-full bg-rouge-clair px-2.5 py-1 text-[0.6875rem] font-semibold text-rouge">
              2 en retard
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.6875rem] font-medium">
              1 essayage
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          {APERCU.map((ligne) => (
            <div
              key={ligne.client + ligne.modele}
              className="rounded-[0.8125rem] border border-bordure bg-white px-2.5 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[0.8125rem] font-semibold">
                  {ligne.client}
                </span>
                <span
                  className={`flex-none rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${ligne.etiquetteClasse}`}
                >
                  {ligne.etiquette}
                </span>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-2">
                <span className="truncate text-[0.6875rem] text-gris">
                  {ligne.modele}
                </span>
                <span
                  className={`chiffres text-[0.6875rem] font-semibold ${ligne.resteClasse}`}
                >
                  {ligne.reste}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="flex items-center gap-[0.15625rem]">
                  {ligne.jalons.map((jalon, n) => (
                    <span
                      key={n}
                      style={{ width: jalon.largeur }}
                      className={`h-1 rounded-sm ${jalon.fond}`}
                    />
                  ))}
                </span>
                <span className="ml-auto rounded-[0.5625rem] bg-vert-clair px-2.5 py-1.5 text-[0.6875rem] font-semibold text-foret">
                  {ligne.suivant} →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/*
 * Le hero tient dans un panneau sombre a grands angles, pose dans la page
 * plutot qu'etale d'un bord a l'autre. Le cadre donne l'aplomb, le fond
 * foret donne la profondeur.
 *
 * Le texte passe a gauche et l'apercu a droite : c'est l'ordre de lecture,
 * et la promesse doit arriver avant la demonstration. Sur telephone la
 * colonne unique conserve ce meme ordre, sans inversion a gerer.
 *
 * sur-fond-sombre bascule l'anneau de focus en blanc : le vert de l'anneau
 * par defaut disparaitrait dans le vert foret.
 */
function Hero() {
  return (
    <section className="px-4 pt-6 sm:px-5">
      <div className="sur-fond-sombre mx-auto grid max-w-6xl items-center gap-9 overflow-hidden rounded-[1.25rem] bg-foret px-5 py-8 text-white sm:rounded-[1.75rem] sm:px-7 sm:py-11 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-14 lg:py-16">
        <div>
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-[0.78125rem] font-medium text-vert-pale">
            Conçu pour les ateliers de couture
          </span>
          <h1 className="mt-5 text-[2rem] leading-[1.02] font-semibold tracking-tight sm:text-[2.625rem] lg:text-[3.75rem]">
            Ce qu&apos;il faut livrer aujourd&apos;hui, dès l&apos;ouverture.
          </h1>
          <p className="mt-5 max-w-[28.75rem] text-lg leading-relaxed text-vert-pale">
            Mesures, commandes, acomptes, reçus WhatsApp. Sur votre téléphone,
            une main sur l&apos;écran, même quand le réseau tombe.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/signup"
              className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-controle bg-white px-6 text-base font-semibold text-foret transition-colors duration-150 ease-doux hover:bg-vert-clair active:translate-y-px"
            >
              Essayer gratuitement
              <ArrowRight size={17} weight="fill" />
            </Link>
            <a
              href={lienWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-controle border border-white/25 px-6 text-base font-medium text-white transition-colors duration-150 ease-doux hover:bg-white/10 active:translate-y-px"
            >
              <WhatsappLogo size={18} weight="fill" />
              Poser une question
            </a>
          </div>
          <p className="mt-4 text-[0.84375rem] text-vert-pale">
            Gratuit jusqu&apos;à 5 commandes en cours · sans carte bancaire ·
            paiement Mobile Money ensuite
          </p>
        </div>

        <div className="flex justify-center">
          <Boitier>
            <ApercuTelephone />
          </Boitier>
        </div>
      </div>
    </section>
  );
}

/*
 * Le constat repasse sur fond clair et s'aligne a gauche. Il etait centre
 * sur un aplat sombre, juste apres le hero sombre : deux panneaux fonces a
 * la suite, et la page n'avait plus de respiration entre l'accroche et
 * l'argument.
 */
function Constat() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-5 lg:pt-24">
      <p className="max-w-[52.5rem] text-[1.3125rem] leading-snug font-medium tracking-tight text-encre sm:text-[1.625rem] lg:text-[2.125rem]">
        Soixante commandes dans la tête, des mesures notées sur un bout de
        papier, et un client qui repasse pour la troisième fois demander si
        c&apos;est prêt.
      </p>
      <p className="mt-5 text-lg text-gris">
        Ce n&apos;est pas un problème d&apos;organisation. C&apos;est un
        problème d&apos;outil.
      </p>
    </section>
  );
}

/*
 * La photo d'atelier, assombrie par un degrade qui part du bord gauche pour
 * que la phrase se detache sans caisson ni fond pose derriere elle.
 *
 * priority : c'est la premiere image lourde de la page, et elle entre dans
 * le champ tot sur telephone.
 */
function Photo() {
  return (
    <section className="px-4 pt-16 sm:px-5 lg:pt-20">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.5rem]">
        <Image
          src="/photos/atelier.jpg"
          alt="Un tailleur dans son atelier, téléphone en main"
          width={1264}
          height={842}
          priority
          className="block h-60 w-full object-cover sm:h-[18.75rem] lg:h-[23.75rem]"
        />
        {/* Degrade ecrit en clair plutot qu'en utilitaires : trois arrets
            avec une position au milieu, c'est le point ou la classe devient
            moins lisible que la regle qu'elle produit. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgb(12 59 46 / 0.92) 0%, rgb(12 59 46 / 0.55) 55%, rgb(12 59 46 / 0.15) 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-end p-6 sm:p-10">
          <p className="max-w-[26.875rem] text-lg leading-snug font-medium text-white sm:text-xl">
            L&apos;atelier ne s&apos;arrête pas pour remplir un tableau.
            TailorHub se tient d&apos;une main, entre deux clients.
          </p>
        </div>
      </div>
    </section>
  );
}

/*
 * Quatre cartes, chacune montrant l'ecran dont elle parle plutot que de le
 * decrire. Aucune capture : tout est dessine en balisage, donc net, leger,
 * et impossible a laisser perimer.
 *
 * La grille est deliberement inegale - 1,35 contre 1 - pour que les deux
 * cartes qui portent une demonstration large aient la place, et que la page
 * n'ait pas l'air d'un damier.
 */
function Fonctions() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-5 lg:pt-24">
      <h2 className="max-w-[38.75rem] text-[1.625rem] leading-tight font-semibold tracking-tight text-encre sm:text-[2rem] lg:text-[2.5rem]">
        Tout ce que vous notiez sur papier, au même endroit
      </h2>

      <div className="mt-11 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-panneau border border-bordure bg-white p-6 shadow-carte sm:p-8">
          <h3 className="text-[1.375rem] font-semibold tracking-tight text-encre">
            Où en est l&apos;atelier, en une ligne
          </h3>
          <p className="mt-2.5 max-w-[26.25rem] leading-relaxed text-gris">
            Sept étapes, de Reçu à Livré. La barre du haut montre où sont vos
            pièces ; la liste en dessous les range par échéance, les retards
            d&apos;abord.
          </p>
          <div className="mt-6 rounded-carte border border-bordure bg-papier p-4">
            <div className="text-[0.625rem] font-semibold tracking-[0.1em] text-gris uppercase">
              Où en est l&apos;atelier
            </div>
            {/* La barre est un doublon graphique des chiffres qui la
                suivent : elle n'apporte rien a qui ne la voit pas. */}
            <div
              aria-hidden="true"
              className="mt-2.5 flex h-3.5 gap-[0.1875rem] overflow-hidden rounded-full"
            >
              {SEGMENTS.map((segment) => (
                <div
                  key={segment.label}
                  style={{ width: segment.part, background: segment.fond }}
                />
              ))}
            </div>
            <div className="mt-2.5 flex">
              {SEGMENTS.map((segment) => (
                <div key={segment.label} className="flex-1">
                  <span className="chiffres text-sm font-semibold text-encre">
                    {segment.nombre}
                  </span>{" "}
                  <span className="text-[0.71875rem] text-gris">
                    {segment.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-panneau bg-vert p-6 text-white sm:p-8">
          <Ruler size={34} />
          <div className="mt-10">
            <h3 className="text-[1.375rem] font-semibold tracking-tight">
              Les mesures gardées à vie
            </h3>
            <p className="mt-2.5 leading-relaxed text-vert-clair">
              Plus besoin de remesurer un client fidèle. Chaque relevé est daté,
              conservé, réutilisable en une touche.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {MESURES.map((mesure) => (
              <div
                key={mesure.nom}
                className="flex items-baseline justify-between gap-2 rounded-controle bg-white/10 px-2.5 py-2"
              >
                <span className="text-xs text-vert-clair">{mesure.nom}</span>
                <span className="chiffres text-[0.8125rem] font-semibold">
                  {mesure.valeur}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-panneau border border-bordure bg-papier p-6 sm:p-8">
          <h3 className="text-[1.375rem] font-semibold tracking-tight text-encre">
            Le reçu part sur WhatsApp
          </h3>
          <p className="mt-2.5 leading-relaxed text-gris">
            Montant versé, reste à payer, date de livraison. En image, dans la
            conversation, en deux gestes.
          </p>
          {/*
           * Le fac-simile du recu reel, et non une carte inventee.
           *
           * Il montrait un numero d'ordre, un prix et un reste. Le vrai
           * document porte un en-tete vert foret au nom de l'atelier, une
           * reference tiree de la commande, l'etape ou en est la piece, et le
           * detail de chaque versement avec son moyen de paiement. Une
           * vitrine qui promet moins que le produit se paie a la premiere
           * commande passee.
           */}
          <div className="mt-6 max-w-80 overflow-hidden rounded-carte border border-bordure bg-white">
            <div className="bg-foret px-4 py-3.5 text-white">
              <div className="text-[0.9375rem] font-semibold tracking-tight">
                Atelier Sossou
              </div>
              <div className="mt-0.5 text-[0.6875rem] text-vert-pale">
                Reçu N° 8F3A21C0 · 25/08/2026
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-col gap-1.5 text-[0.8125rem]">
                <Ligne libelle="Client" valeur="Koffi Ahossi" fort />
                <Ligne libelle="Modèle" valeur="Costume deux pièces" />
                <Ligne libelle="État" valeur="Prêt à retirer" />
                <Ligne libelle="Livraison prévue" valeur="25/08/2026" />
              </div>

              {/* Montants empiles : chasse fixe, sinon les chiffres dansent
                  d'une ligne a l'autre. */}
              <div className="chiffres mt-3 border-t border-bordure pt-3">
                <Ligne libelle="Prix total" valeur="78 000 FCFA" fort />

                {/* Le moyen figure sur le vrai recu : c'est la que le client
                    verifie qu'un envoi Mobile Money a bien ete compte. */}
                <div className="mt-1.5 flex justify-between gap-3 text-[0.6875rem] text-gris">
                  <span className="truncate">
                    12/08/2026 · Acompte · Mobile Money
                  </span>
                  <span className="shrink-0">40 000 FCFA</span>
                </div>

                <div className="mt-1.5">
                  <Ligne libelle="Déjà versé" valeur="40 000 FCFA" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-bordure pt-3">
                <span className="font-semibold text-encre">Reste à payer</span>
                <span className="chiffres font-semibold text-rouge">
                  38 000 FCFA
                </span>
              </div>

              <p className="mt-3 text-[0.6875rem] text-gris">
                Merci de votre confiance.
              </p>
            </div>
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-panneau border border-bordure bg-white p-6 sm:p-8">
          <div>
            <h3 className="text-[1.375rem] font-semibold tracking-tight text-encre">
              Savoir qui vous doit combien
            </h3>
            <p className="mt-2.5 leading-relaxed text-gris">
              Chaque acompte enregistré, le reste calculé tout seul, et la liste
              de ceux à relancer — du plus gros montant au plus petit.
            </p>
          </div>
          <div className="mt-6 rounded-carte border border-bordure p-4">
            <div className="text-[0.625rem] font-semibold tracking-[0.1em] text-gris uppercase">
              Créances
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[2.125rem] leading-none font-semibold tracking-tight text-rouge">
                221 000
              </span>
              <span className="text-xs text-gris">FCFA</span>
            </div>
            <div className="mt-3 flex flex-col">
              {IMPAYES.map((impaye) => (
                <div
                  key={impaye.client}
                  className="flex items-baseline justify-between gap-2.5 border-t border-bordure py-2"
                >
                  <span className="text-[0.8125rem] text-encre">
                    {impaye.client}
                  </span>
                  <span className="text-[0.71875rem] text-gris">
                    {impaye.age}
                  </span>
                  <span className="chiffres text-[0.8125rem] font-semibold text-rouge">
                    {impaye.montant}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

/*
 * Le hors-ligne montre les deux etats plutot que de les raconter, et la
 * derniere phrase enonce la regle des couleurs. C'est le seul endroit de la
 * page ou le produit explique sa propre grammaire - la ou un tailleur peut
 * la comprendre avant de s'inscrire, plutot que de la deviner apres.
 */
function HorsLigne() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-5 lg:pt-24">
      <div className="grid items-center gap-9 border-t border-bordure pt-14 lg:grid-cols-2 lg:gap-14">
        <div>
          <WifiSlash size={38} className="text-vert" />
          <h2 className="mt-4 text-[1.625rem] leading-tight font-semibold tracking-tight text-encre sm:text-[2rem] lg:text-[2.5rem]">
            La connexion coupe. Vous continuez.
          </h2>
          <p className="mt-4 max-w-[30rem] leading-relaxed text-gris sm:text-[1.0625rem]">
            Prenez une commande, des mesures, un acompte sans réseau.
            L&apos;application vous dit ce qui est gardé sur l&apos;appareil et
            ce qui est parti — sans jamais vous bloquer, parce que perdre le
            réseau n&apos;est pas une panne, c&apos;est votre quotidien.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2.5 rounded-carte border border-bordure bg-white px-4 py-3.5">
            <span className="size-2 rounded-full bg-vert-pale" />
            <span className="text-sm font-medium text-gris">À jour</span>
            <span className="ml-auto text-[0.78125rem] text-gris">
              Dernier envoi 14:32
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 rounded-carte bg-bleu-clair px-4 py-3.5">
            <span className="size-2 rounded-full bg-bleu" />
            <span className="text-sm font-semibold text-bleu">
              Hors connexion · 2 fiches sur l&apos;appareil
            </span>
            <span className="ml-auto text-[0.78125rem] text-bleu">
              Envoi au retour du réseau
            </span>
          </div>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-gris">
            Le bleu ne sert qu&apos;à ça : quand l&apos;application parle
            d&apos;elle-même. Le vert parle de votre métier, le rouge d&apos;un
            problème.
          </p>
        </div>
      </div>
    </section>
  );
}

function Tarifs() {
  return (
    <section
      id="tarifs"
      className="sur-fond-sombre mt-16 scroll-mt-16 bg-foret px-4 py-20 text-white sm:px-5 lg:mt-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-[1.625rem] leading-tight font-semibold tracking-tight sm:text-[2rem] lg:text-[2.5rem]">
          Un prix, pas de surprise
        </h2>
        <p className="mt-3.5 text-lg text-vert-pale">
          Moins qu&apos;une commande par mois. Résiliable quand vous voulez.
        </p>

        <div className="mt-11 grid items-start gap-5 md:grid-cols-3">
          {OFFRES.map((offre) => {
            const mis = offre.nom === FORMULE_MISE_EN_AVANT;
            return (
              <article
                key={offre.nom}
                className={`relative flex flex-col rounded-panneau border p-7 ${
                  mis ? "border-white bg-white text-encre" : "border-vert bg-foret"
                }`}
              >
                {mis && (
                  <span className="absolute -top-3 left-7 rounded-full bg-vert px-3 py-1 text-xs font-semibold text-white">
                    Recommandé
                  </span>
                )}

                <h3 className="text-lg font-semibold">{offre.nom}</h3>
                <p
                  className={`mt-1.5 text-[0.84375rem] ${mis ? "text-gris" : "text-vert-pale"}`}
                >
                  {offre.pour}
                </p>

                <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[2.375rem] font-semibold tracking-tight">
                    {offre.prix}
                  </span>
                  <span
                    className={`text-sm ${mis ? "text-gris" : "text-vert-pale"}`}
                  >
                    {offre.unite}
                  </span>
                </p>

                <ul className="mt-6 space-y-3">
                  {offre.avantages.map((avantage) => (
                    <li key={avantage} className="flex items-start gap-2.5">
                      <CheckCircle
                        size={17}
                        weight="fill"
                        className={`mt-0.5 shrink-0 ${mis ? "text-vert" : "text-vert-pale"}`}
                      />
                      <span
                        className={`text-sm leading-snug ${mis ? "text-encre" : "text-vert-clair"}`}
                      >
                        {avantage}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-7 inline-flex min-h-[3.125rem] items-center justify-center rounded-controle border border-vert text-[0.9375rem] font-semibold text-white transition-colors active:translate-y-px ${
                    mis ? "bg-vert hover:bg-foret" : "hover:bg-vert"
                  }`}
                >
                  {offre.cta}
                </Link>
              </article>
            );
          })}
        </div>

        <p className="mt-7 text-sm text-vert-pale">
          Paiement par Mobile Money. Vous commencez sur l&apos;offre Découverte,
          vous changez quand votre carnet se remplit.
        </p>
      </div>
    </section>
  );
}

/*
 * L'accordeon reste en HTML nu.
 *
 * La maquette le pilotait en JavaScript, avec une seule reponse ouverte a la
 * fois. L'attribut name sur details donne exactement ce comportement au
 * navigateur, sans une ligne de script envoyee sur l'Android d'entree de
 * gamme qui est notre cible. Un navigateur qui ne connait pas name ouvre
 * simplement plusieurs reponses : la page reste utilisable.
 */
function Questions() {
  return (
    <section
      id="questions"
      className="mx-auto max-w-[51.25rem] scroll-mt-16 px-4 pt-20 sm:px-5"
    >
      <h2 className="text-[1.625rem] leading-tight font-semibold tracking-tight text-encre sm:text-[2rem] lg:text-[2.5rem]">
        Questions fréquentes
      </h2>
      <div className="mt-8">
        {QUESTIONS.map((item, n) => (
          <details
            key={item.q}
            name="questions"
            open={n === 0}
            className="group border-b border-bordure [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-[1.03125rem] font-semibold text-encre">
              {item.q}
              <span
                aria-hidden="true"
                className="flex-none text-xl font-normal text-gris"
              >
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">−</span>
              </span>
            </summary>
            <p className="pr-10 pb-5 leading-relaxed text-gris">{item.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function AppelFinal() {
  return (
    <section className="mt-20 bg-vert-clair px-4 py-20 sm:px-5">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-[1.625rem] leading-tight font-semibold tracking-tight text-encre sm:text-[2rem] lg:text-[2.5rem]">
          Essayez sur vos trois prochaines commandes
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-encre">
          L&apos;offre Découverte est gratuite et sans limite de durée. Si ça ne
          vous fait pas gagner de temps, vous arrêtez.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-controle bg-vert px-6 text-base font-semibold text-white transition-colors hover:bg-foret active:translate-y-px"
          >
            Essayer gratuitement
            <ArrowRight size={17} weight="fill" />
          </Link>
          <a
            href={lienWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-controle border border-bordure bg-white px-6 text-base font-medium text-encre transition-colors hover:bg-papier active:translate-y-px"
          >
            <WhatsappLogo size={18} weight="fill" className="text-vert" />
            Poser une question
          </a>
        </div>
      </div>
    </section>
  );
}

function PiedDePage() {
  return (
    <footer className="bg-white px-4 py-11 sm:px-5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-sm text-gris sm:flex-row sm:text-left">
        <span className="flex items-center gap-2.5 font-semibold text-encre">
          <span className="text-vert">
            <Marque taille={20} />
          </span>
          TailorHub
        </span>
        <p>Conçu pour les ateliers de couture.</p>
        <a href={`mailto:${EMAIL}`} className="text-vert hover:text-foret">
          {EMAIL}
        </a>
      </div>
    </footer>
  );
}

export default function Accueil() {
  return (
    <div className="bg-white">
      <Navigation />
      <main>
        <Hero />
        <Constat />
        <Photo />
        <Fonctions />
        <HorsLigne />
        <Tarifs />
        <Questions />
        <AppelFinal />
      </main>
      <PiedDePage />
    </div>
  );
}
