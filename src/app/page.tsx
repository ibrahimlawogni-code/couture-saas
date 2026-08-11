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

/* Un seul système de formes sur toute la page : boutons en rounded-2xl,
   blocs et cartes en rounded-3xl, images en rounded-3xl. */

function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-bordure bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <span className="text-lg font-semibold tracking-tight text-encre">
          TailorHub
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-2xl px-3 py-2 text-sm font-medium text-gris transition-colors hover:text-encre"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="rounded-2xl bg-foret px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-vert active:translate-y-px"
          >
            Essayer gratuitement
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
      <div>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-encre md:text-5xl lg:text-6xl">
          Votre atelier,
          <br />
          enfin sous contrôle.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-gris">
          Mesures, commandes, acomptes et rappels WhatsApp. Sur votre téléphone,
          même sans connexion.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-vert px-6 py-4 text-base font-medium text-white transition-transform hover:bg-foret active:translate-y-px"
          >
            Essayer gratuitement
            <ArrowRight size={18} weight="bold" />
          </Link>
          <a
            href={lienWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-bordure bg-white px-6 py-4 text-base font-medium text-encre transition-colors hover:bg-papier active:translate-y-px"
          >
            <WhatsappLogo size={18} weight="fill" />
            Poser une question
          </a>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[280px] lg:max-w-[320px]">
        <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-vert-clair" />
        <Image
          src="/captures/commandes.png"
          alt="Le tableau des commandes de TailorHub sur un téléphone"
          width={1170}
          height={2133}
          priority
          className="w-full rounded-3xl border border-bordure shadow-xl"
        />
      </div>
    </section>
  );
}

function Constat() {
  return (
    <section className="bg-foret px-5 py-24 text-white">
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
        <article className="md:col-span-2 overflow-hidden rounded-3xl border border-bordure bg-white">
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
          <div className="ml-8 h-56 overflow-hidden rounded-tl-2xl border-l border-t border-bordure">
            <Image
              src="/captures/commandes.png"
              alt="Suivi des commandes par étape"
              width={1170}
              height={2133}
              className="w-full object-cover object-top"
            />
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-3xl bg-vert p-8 text-white">
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

        <article className="rounded-3xl border border-bordure bg-white p-8">
          <ClockCounterClockwise size={32} weight="light" className="text-gris" />
          <h3 className="mt-10 text-xl font-semibold text-encre">
            Deux dates par commande
          </h3>
          <p className="mt-3 text-gris">
            L&apos;essayage et la livraison. Un rappel part au client au bon
            moment.
          </p>
        </article>

        <article className="md:col-span-2 overflow-hidden rounded-3xl border border-bordure bg-papier">
          <div className="p-8">
            <h3 className="text-xl font-semibold text-encre">
              Le client reçoit son reçu sur WhatsApp
            </h3>
            <p className="mt-3 max-w-md text-gris">
              Montant versé, reste à payer, date de livraison. En image, dans la
              conversation, en deux gestes.
            </p>
          </div>
          <div className="ml-8 h-56 overflow-hidden rounded-tl-2xl border-l border-t border-bordure bg-white">
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
            className="w-full rounded-3xl border border-bordure shadow-lg"
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
      nom: "Atelier",
      prix: "9 000",
      pour: "Pour le tailleur qui travaille seul",
      avantages: [
        "Clients et mesures sans limite",
        "Suivi des commandes et des acomptes",
        "Reçus et rappels WhatsApp",
        "Fonctionne sans connexion",
      ],
      mis: false,
    },
    {
      nom: "Atelier Pro",
      prix: "15 000",
      pour: "Pour un atelier avec des apprentis",
      avantages: [
        "Tout ce que contient Atelier",
        "Jusqu'à 5 personnes sur le même atelier",
        "Bilan financier détaillé",
        "Assistance par WhatsApp sous 24 h",
      ],
      mis: true,
    },
  ];

  return (
    <section className="bg-foret px-5 py-24 text-white">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Un prix, pas de surprise
        </h2>
        <p className="mt-4 text-lg text-vert-pale">
          Les 30 premiers jours sont gratuits, sans carte bancaire.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {offres.map((offre) => (
            <article
              key={offre.nom}
              className={`rounded-3xl p-8 ${
                offre.mis
                  ? "bg-white text-encre"
                  : "border border-vert bg-foret"
              }`}
            >
              <h3 className="text-lg font-semibold">{offre.nom}</h3>
              <p
                className={`mt-1 text-sm ${
                  offre.mis ? "text-gris" : "text-vert-pale"
                }`}
              >
                {offre.pour}
              </p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight">
                  {offre.prix}
                </span>
                <span
                  className={offre.mis ? "text-gris" : "text-vert-pale"}
                >
                  FCFA par mois
                </span>
              </p>
              <ul className="mt-8 space-y-3">
                {offre.avantages.map((avantage) => (
                  <li key={avantage} className="flex items-start gap-3 text-sm">
                    <CheckCircle
                      size={18}
                      weight="fill"
                      className="mt-0.5 shrink-0 text-vert"
                    />
                    <span className={offre.mis ? "text-encre" : "text-vert-clair"}>
                      {avantage}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 block rounded-2xl px-6 py-3.5 text-center text-base font-medium transition-transform active:translate-y-px ${
                  offre.mis
                    ? "bg-vert text-white hover:bg-foret"
                    : "border border-vert text-white hover:bg-vert"
                }`}
              >
                Essayer gratuitement
              </Link>
            </article>
          ))}
        </div>
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
          Trente jours gratuits. Si ça ne vous fait pas gagner de temps, vous
          arrêtez.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-vert px-6 py-4 text-base font-medium text-white transition-transform hover:bg-foret active:translate-y-px"
          >
            Essayer gratuitement
            <ArrowRight size={18} weight="bold" />
          </Link>
          <a
            href={lienWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-bordure bg-white px-6 py-4 text-base font-medium text-encre transition-colors hover:bg-papier active:translate-y-px"
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
