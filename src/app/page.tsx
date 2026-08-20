import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  ClockCounterClockwise,
  Ruler,
  WifiSlash,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Marque } from "./marque";
import { ObjetsCouture } from "./objets-couture";

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
 * systeme propre a cette page : controle pour ce qu'on actionne, panneau
 * pour les grandes surfaces et les captures. Une page de vente qui
 * n'arrondit pas comme le produit qu'elle vend se trahit des le premier
 * ecran passe apres l'inscription.
 */

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
          <Marque taille={26} />
          <span className="text-base font-semibold tracking-tight sm:text-lg">
            TailorHub
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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
            className="rounded-controle bg-foret px-3 py-2.5 text-sm font-medium whitespace-nowrap text-white transition-transform hover:bg-vert active:translate-y-px sm:px-4"
          >
            <span className="sm:hidden">Essayer</span>
            <span className="hidden sm:inline">Essayer gratuitement</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

/*
 * Le hero tient dans un panneau sombre a grands angles, pose dans la page
 * plutot qu'etale d'un bord a l'autre.
 *
 * Il etait sage : deux colonnes sur fond blanc, un aplat vert derriere la
 * capture. Correct, mais sans presence - et c'est la presence, pas la
 * disposition, qui manquait. Le cadre donne l'aplomb, le fond foret donne
 * la profondeur, et les objets de couture donnent le mouvement.
 *
 * sur-fond-sombre bascule l'anneau de focus en blanc : le vert de l'anneau
 * par defaut disparaitrait dans le vert foret.
 */
function Hero() {
  return (
    <section className="px-4 pt-6 pb-16 sm:px-5 lg:pb-24">
      <div className="sur-fond-sombre relative mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] bg-foret px-6 py-12 text-white sm:px-10 sm:py-16 lg:rounded-[2.25rem] lg:px-14 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/*
           * La capture passe a gauche sur grand ecran, le texte a droite.
           * Sur telephone l'ordre s'inverse : on lit d'abord ce que le
           * produit promet, on regarde ensuite a quoi il ressemble.
           */}
          <div className="relative order-2 lg:order-1">
            <ObjetsCouture />
            <div className="relative mx-auto w-full max-w-[220px] sm:max-w-[260px]">
              <Image
                src="/captures/commandes.png"
                alt="Le tableau des commandes de TailorHub sur un téléphone"
                width={1170}
                height={2133}
                priority
                className="w-full rounded-panneau border border-white/15 shadow-flottant"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h1 className="text-[2.25rem] font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
              Votre atelier,
              <br />
              enfin sous contrôle.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-vert-pale">
              Mesures, commandes, acomptes et rappels WhatsApp. Sur votre
              téléphone, même sans connexion.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-controle bg-white px-6 py-4 text-base font-medium text-foret transition-colors duration-150 ease-doux hover:bg-vert-clair active:translate-y-px"
              >
                Essayer gratuitement
                <ArrowRight size={18} weight="bold" />
              </Link>
              <a
                href={lienWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-controle border border-white/25 px-6 py-4 text-base font-medium text-white transition-colors duration-150 ease-doux hover:bg-white/10 active:translate-y-px"
              >
                <WhatsappLogo size={18} weight="fill" />
                Poser une question
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Constat() {
  return (
    <section className="sur-fond-sombre bg-foret px-5 py-24 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-2xl font-medium leading-snug tracking-tight md:text-3xl">
          Soixante commandes dans la tête, des mesures notées sur un bout de
          papier, et un client qui repasse pour la troisième fois demander si
          c&apos;est prêt.
        </p>
        <p className="mt-6 text-lg text-vert-pale">
          Ce n&apos;est pas un problème d&apos;organisation. C&apos;est un
          problème d&apos;outil.
        </p>
      </div>
    </section>
  );
}

function Fonctions() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-encre md:text-4xl">
        Tout ce que vous notiez sur papier, au même endroit
      </h2>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <article className="md:col-span-2 overflow-hidden rounded-panneau border border-bordure bg-white">
          <div className="p-8">
            <h3 className="text-xl font-semibold text-encre">
              Voyez où en est chaque commande
            </h3>
            <p className="mt-3 max-w-md text-gris">
              Reçu, coupe, couture, essayage, prêt à retirer. Les retards
              passent en rouge avant que le client ne s&apos;énerve.
            </p>
          </div>
          {/* Hauteur fixe : une capture de telephone entiere allongerait la
              page et desequilibrerait la grille. On n'en montre que le haut. */}
          <div className="ml-8 h-56 overflow-hidden rounded-tl-panneau border-l border-t border-bordure">
            <Image
              src="/captures/commandes.png"
              alt="Suivi des commandes par étape"
              width={1170}
              height={2133}
              className="w-full object-cover object-top"
            />
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-panneau bg-vert p-8 text-white">
          <Ruler size={32} weight="light" />
          <div className="mt-10">
            <h3 className="text-xl font-semibold">
              Les mesures gardées à vie
            </h3>
            <p className="mt-3 text-vert-clair">
              Plus besoin de remesurer un client fidèle. Chaque relevé est daté
              et conservé.
            </p>
          </div>
        </article>

        <article className="rounded-panneau border border-bordure bg-white p-8">
          <ClockCounterClockwise size={32} weight="light" className="text-gris" />
          <h3 className="mt-10 text-xl font-semibold text-encre">
            Deux dates par commande
          </h3>
          <p className="mt-3 text-gris">
            L&apos;essayage et la livraison. Un rappel part au client au bon
            moment.
          </p>
        </article>

        <article className="md:col-span-2 overflow-hidden rounded-panneau border border-bordure bg-papier">
          <div className="p-8">
            <h3 className="text-xl font-semibold text-encre">
              Le client reçoit son reçu sur WhatsApp
            </h3>
            <p className="mt-3 max-w-md text-gris">
              Montant versé, reste à payer, date de livraison. En image, dans la
              conversation, en deux gestes.
            </p>
          </div>
          <div className="ml-8 h-56 overflow-hidden rounded-tl-panneau border-l border-t border-bordure bg-white">
            <Image
              src="/captures/fiche-client.png"
              alt="Fiche client avec ses mesures et ses commandes"
              width={1170}
              height={2133}
              className="w-full object-cover object-top"
            />
          </div>
        </article>
      </div>
    </section>
  );
}

function Argent() {
  return (
    <section className="border-y border-bordure bg-papier px-5 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative mx-auto w-full max-w-[260px]">
          <Image
            src="/captures/finances.png"
            alt="Bilan financier du mois et liste des impayés"
            width={1170}
            height={2628}
            className="w-full rounded-panneau border border-bordure shadow-lg"
          />
        </div>

        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-encre md:text-4xl">
            Savoir qui vous doit combien
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-gris">
            Chaque acompte est enregistré, le reste à payer se calcule tout
            seul. En fin de mois vous voyez ce qui est entré en caisse, et la
            liste de ceux qu&apos;il faut relancer, du plus gros montant au plus
            petit.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Encaissé du mois, séparé des commandes prises",
              "Total des créances, commande par commande",
              "Reçu partageable pour chaque versement",
            ].map((ligne) => (
              <li key={ligne} className="flex items-start gap-3 text-encre">
                <CheckCircle
                  size={20}
                  weight="fill"
                  className="mt-0.5 shrink-0 text-vert"
                />
                {ligne}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function HorsLigne() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-24 text-center">
      <WifiSlash size={40} weight="light" className="mx-auto text-vert" />
      <h2 className="mt-6 text-3xl font-semibold tracking-tight text-encre md:text-4xl">
        La connexion coupe. Vous continuez.
      </h2>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gris">
        Prenez une commande et des mesures sans réseau. Tout part
        automatiquement dès que la connexion revient, sans rien avoir à
        ressaisir.
      </p>
    </section>
  );
}

function Tarifs() {
  const offres = [
    {
      nom: "Découverte",
      prix: "Gratuit",
      unite: "sans limite de durée",
      pour: "Pour essayer sur de vraies commandes",
      avantages: [
        "5 clients",
        "5 commandes en cours",
        "Mesures et acomptes",
        "Reçus et rappels WhatsApp",
      ],
      mis: false,
      cta: "Commencer",
    },
    {
      nom: "Atelier",
      prix: "3 500",
      unite: "FCFA par mois",
      pour: "Pour le tailleur qui travaille seul",
      avantages: [
        "Clients et commandes sans limite",
        "Bilan financier du mois",
        "Fonctionne sans connexion",
        "Sans engagement",
      ],
      mis: false,
      cta: "Choisir Atelier",
    },
    {
      nom: "Atelier Pro",
      prix: "5 000",
      unite: "FCFA par mois",
      pour: "Pour un atelier avec des apprentis",
      avantages: [
        "Tout ce que contient Atelier",
        "Jusqu'à 5 apprentis sur le même atelier",
        "Chacun son compte, ses commandes visibles",
        "Assistance WhatsApp sous 24 h",
      ],
      mis: true,
      cta: "Choisir Atelier Pro",
    },
  ];

  return (
    <section
      id="tarifs"
      className="sur-fond-sombre scroll-mt-8 bg-foret px-5 py-24 text-white"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Un prix, pas de surprise
        </h2>
        <p className="mt-4 text-lg text-vert-pale">
          Moins qu&apos;une commande par mois. Résiliable quand vous voulez.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {offres.map((offre) => (
            <article
              key={offre.nom}
              className={`relative flex flex-col rounded-panneau p-7 ${
                offre.mis ? "bg-white text-encre" : "border border-vert bg-foret"
              }`}
            >
              {offre.mis && (
                <span className="absolute -top-3 left-7 rounded-full bg-vert px-3 py-1 text-xs font-semibold text-white">
                  Recommandé
                </span>
              )}

              <h3 className="text-lg font-semibold">{offre.nom}</h3>
              <p
                className={`mt-1 text-sm ${offre.mis ? "text-gris" : "text-vert-pale"}`}
              >
                {offre.pour}
              </p>

              <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
                <span className="text-4xl font-semibold tracking-tight">
                  {offre.prix}
                </span>
                <span className={offre.mis ? "text-gris" : "text-vert-pale"}>
                  {offre.unite}
                </span>
              </p>

              <ul className="mt-7 space-y-3">
                {offre.avantages.map((avantage) => (
                  <li key={avantage} className="flex items-start gap-3 text-sm">
                    <CheckCircle
                      size={18}
                      weight="fill"
                      className={`mt-0.5 shrink-0 ${
                        offre.mis ? "text-vert" : "text-vert-pale"
                      }`}
                    />
                    <span className={offre.mis ? "text-encre" : "text-vert-clair"}>
                      {avantage}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`mt-8 block rounded-controle px-6 py-3.5 text-center text-base font-medium transition-transform active:translate-y-px ${
                  offre.mis
                    ? "bg-vert text-white hover:bg-foret"
                    : "border border-vert text-white hover:bg-vert"
                }`}
              >
                {offre.cta}
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-8 text-sm text-vert-pale">
          Paiement par Mobile Money. Vous commencez sur l&apos;offre Découverte,
          vous changez quand votre carnet se remplit.
        </p>
      </div>
    </section>
  );
}

function Questions() {
  const questions = [
    {
      q: "Faut-il savoir se servir d'un ordinateur ?",
      r: "Non. TailorHub s'utilise sur le téléphone, avec de gros boutons et des écrans simples. Si vous savez envoyer un message WhatsApp, vous saurez vous en servir.",
    },
    {
      q: "Et si je n'ai pas de connexion à l'atelier ?",
      r: "Vous pouvez quand même enregistrer un client, ses mesures et une commande. Tout est envoyé automatiquement dès que le réseau revient.",
    },
    {
      q: "Mes clients doivent-ils installer quelque chose ?",
      r: "Non. Ils reçoivent simplement vos reçus et vos rappels sur WhatsApp, comme un message normal.",
    },
    {
      q: "Que deviennent mes données si j'arrête ?",
      r: "Elles vous appartiennent. Vous pouvez demander une copie de vos clients et de vos commandes à tout moment.",
    },
  ];

  return (
    <section className="mx-auto max-w-3xl px-5 py-24">
      <h2 className="text-3xl font-semibold tracking-tight text-encre md:text-4xl">
        Questions fréquentes
      </h2>
      <div className="mt-10">
        {questions.map((item) => (
          <details
            key={item.q}
            className="group border-b border-bordure py-5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-medium text-encre">
              {item.q}
              <span className="shrink-0 text-gris transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-gris">{item.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function AppelFinal() {
  return (
    <section className="border-t border-bordure bg-vert-clair px-5 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-encre md:text-4xl">
          Essayez sur vos trois prochaines commandes
        </h2>
        <p className="mt-5 text-lg text-encre">
          L&apos;offre Découverte est gratuite et sans limite de durée. Si ça ne
          vous fait pas gagner de temps, vous arrêtez.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-controle bg-vert px-6 py-4 text-base font-medium text-white transition-transform hover:bg-foret active:translate-y-px"
          >
            Essayer gratuitement
            <ArrowRight size={18} weight="bold" />
          </Link>
          <a
            href={lienWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-controle border border-bordure bg-white px-6 py-4 text-base font-medium text-encre transition-colors hover:bg-papier active:translate-y-px"
          >
            <WhatsappLogo size={18} weight="fill" />
            Poser une question
          </a>
        </div>
      </div>
    </section>
  );
}

function PiedDePage() {
  return (
    <footer className="bg-white px-5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-gris sm:flex-row">
        <span className="font-semibold text-encre">TailorHub</span>
        <p>Conçu à Porto-Novo pour les ateliers de couture.</p>
        <a href={`mailto:${EMAIL}`} className="hover:text-encre">
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
        <Fonctions />
        <Argent />
        <HorsLigne />
        <Tarifs />
        <Questions />
        <AppelFinal />
      </main>
      <PiedDePage />
    </div>
  );
}
