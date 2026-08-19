"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Plus,
  TrendDown,
  TrendUp,
  UserPlus,
} from "@phosphor-icons/react/dist/ssr";
import {
  STATUT_LABELS,
  formaterMontant,
  priorite,
  resteAPayer,
  versesParCommande,
  type Statut,
} from "@/lib/commandes";
import { useDonnees } from "@/lib/offline/use-donnees";
import { Carte, CarteLien, Panneau } from "@/ui/carte";
import { Vignette } from "@/ui/vignette";
import { Compteur, Etiquette, type TonEtiquette } from "@/ui/etiquette";
import { EnTeteSection } from "@/ui/page";
import { Squelette, SqueletteLigne } from "@/ui/squelette";
import { GraphiqueEncaissements, type PointMensuel } from "./graphique";

const MOIS_AFFICHES = 6;
const A_TRAITER_MAX = 6;

const nombre = new Intl.NumberFormat("fr-FR");

function memeJour(a: string | null, b: Date) {
  if (!a) return false;
  const date = new Date(a);
  return (
    date.getFullYear() === b.getFullYear() &&
    date.getMonth() === b.getMonth() &&
    date.getDate() === b.getDate()
  );
}

/*
 * Ce qui fait remonter une commande dans « A traiter », et sous quel ton.
 *
 * L'ordre compte : une commande en retard qui a aussi un essayage
 * aujourd'hui est d'abord en retard. Le retard est le seul des trois cas
 * ou quelque chose a deja mal tourne.
 */
function motif(commande: {
  niveau: string;
  essayageAujourdhui: boolean;
  statut: string;
}): { texte: string; ton: TonEtiquette } | null {
  if (commande.niveau === "en_retard")
    return { texte: "En retard", ton: "probleme" };
  if (commande.essayageAujourdhui)
    return { texte: "Essayage", ton: "attention" };
  if (commande.statut === "pret") return { texte: "À retirer", ton: "metier" };
  return null;
}

export function TableauDeBord() {
  const { atelier, clients, commandes, paiements, chargee } = useDonnees();

  const bilan = useMemo(() => {
    const maintenant = new Date();
    const debutMois = new Date(
      maintenant.getFullYear(),
      maintenant.getMonth(),
      1,
    );

    const encaisseMois = paiements
      .filter((p) => new Date(p.created_at) >= debutMois)
      .reduce((somme, p) => somme + Number(p.montant), 0);

    const enCours = commandes.filter((c) => c.statut !== "livre");

    const verseParCommande = versesParCommande(paiements);

    const restes = commandes.map((commande) =>
      resteAPayer(commande.prix_total, verseParCommande.get(commande.id) ?? 0),
    );
    const creances = restes.reduce(
      (somme, reste) => somme + (reste > 0 ? reste : 0),
      0,
    );
    const nbImpayes = restes.filter((reste) => reste > 0).length;

    // Ce qui reclame une decision aujourd'hui, dans l'ordre d'urgence.
    const nomsClients = new Map(clients.map((c) => [c.id, c.nom]));
    const aTraiter = enCours
      .map((commande) => ({
        ...commande,
        client: nomsClients.get(commande.client_id) ?? "Client inconnu",
        niveau: priorite(commande.date_livraison, commande.statut as Statut),
        essayageAujourdhui: memeJour(commande.date_essayage, maintenant),
        reste: resteAPayer(
          commande.prix_total,
          verseParCommande.get(commande.id) ?? 0,
        ),
      }))
      .filter(
        (c) =>
          c.niveau === "en_retard" ||
          c.essayageAujourdhui ||
          c.statut === "pret",
      )
      .sort((a, b) =>
        (a.date_livraison ?? "9999").localeCompare(b.date_livraison ?? "9999"),
      );

    // Six derniers mois d'encaissements, mois courant inclus.
    const points: PointMensuel[] = [];
    for (let recul = MOIS_AFFICHES - 1; recul >= 0; recul--) {
      const debut = new Date(
        maintenant.getFullYear(),
        maintenant.getMonth() - recul,
        1,
      );
      const fin = new Date(
        maintenant.getFullYear(),
        maintenant.getMonth() - recul + 1,
        1,
      );

      points.push({
        mois: debut.toISOString().slice(0, 7),
        libelle: debut
          .toLocaleDateString("fr-FR", { month: "short" })
          .replace(".", ""),
        montant: paiements
          .filter((p) => {
            const date = new Date(p.created_at);
            return date >= debut && date < fin;
          })
          .reduce((somme, p) => somme + Number(p.montant), 0),
      });
    }

    /*
     * L'ecart avec le mois precedent. Sans lui, un montant seul ne dit pas
     * si le mois est bon : c'est la comparaison qui porte l'information,
     * pas le nombre.
     *
     * Un mois precedent a zero ne donne pas un ecart infini mais pas
     * d'ecart du tout : « +∞ % » ne veut rien dire pour personne.
     */
    const precedent = points[points.length - 2];
    const ecart =
      precedent && precedent.montant > 0
        ? ((encaisseMois - precedent.montant) / precedent.montant) * 100
        : null;

    return {
      encaisseMois,
      enCours,
      creances,
      nbImpayes,
      aTraiter,
      points,
      ecart,
      moisPrecedent: precedent?.libelle ?? "",
    };
  }, [clients, commandes, paiements]);

  if (!chargee) return <SqueletteBord />;

  const heure = new Date().getHours();
  const salutation = heure < 18 ? "Bonjour" : "Bonsoir";
  const enRetard = bilan.aTraiter.filter(
    (c) => c.niveau === "en_retard",
  ).length;

  return (
    <>
      {/*
       * Le panneau porte le chiffre d'accroche de l'ecran, et le graphique
       * qui lui donne son sens. Ils vivaient dans deux cartes distinctes :
       * le montant du mois d'un cote, sa courbe de l'autre, ce qui obligeait
       * a faire l'aller-retour pour savoir si le mois etait bon.
       */}
      <Panneau classe="p-5 lg:p-6">
        {/*
         * Sur grand ecran, les deux actions se rangent a droite du montant
         * plutot que dessous. Le panneau tient alors en une bande, et
         * l'ecran entier gagne les quelque soixante-dix pixels qui le
         * faisaient deborder d'un portable.
         */}
        <div className="lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="lg:min-w-0 lg:flex-1">
            <p className="text-sm text-vert-pale">
              {salutation}
              {atelier?.nom ? `, ${atelier.nom}` : ""} ·{" "}
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>

            <p className="mt-4 text-[11px] font-medium tracking-[0.12em] text-vert-pale uppercase">
              Encaissé ce mois
            </p>

            {/*
             * Chiffres proportionnels, jamais tabulaires : la chasse fixe donne
             * a chaque chiffre la largeur d'un zero, ce qui distend visiblement
             * une valeur de cette taille. La devise est en retrait, elle se
             * repete a chaque lecture et n'a pas a peser autant que le montant.
             */}
            <p className="mt-0.5 flex items-baseline gap-2">
              <span className="text-[2.125rem] leading-none font-semibold tracking-tight sm:text-5xl">
                {nombre.format(bilan.encaisseMois)}
              </span>
              <span className="text-sm font-medium text-vert-pale">FCFA</span>
            </p>

            {bilan.ecart !== null && (
              <p
                className={`mt-2 flex items-center gap-1.5 text-sm ${
                  bilan.ecart >= 0 ? "text-vert-pale" : "text-ambre-clair"
                }`}
              >
                {bilan.ecart >= 0 ? (
                  <TrendUp size={15} weight="bold" aria-hidden />
                ) : (
                  <TrendDown size={15} weight="bold" aria-hidden />
                )}
                <span>
                  {bilan.ecart >= 0 ? "+" : "−"}
                  {Math.abs(Math.round(bilan.ecart))} % sur{" "}
                  {bilan.moisPrecedent}
                </span>
              </p>
            )}

          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:mt-0 lg:shrink-0 lg:flex-col xl:flex-row">
            <Link
              href="/commandes/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-controle bg-white px-5 text-sm font-medium text-foret transition-colors duration-150 ease-doux hover:bg-vert-clair"
            >
              <Plus size={16} weight="bold" />
              Nouvelle commande
            </Link>
            <Link
              href="/clients/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-controle border border-white/25 px-5 text-sm font-medium text-white transition-colors duration-150 ease-doux hover:bg-white/10"
            >
              <UserPlus size={16} />
              Nouveau client
            </Link>
          </div>
        </div>
      </Panneau>

      {/*
       * Deux colonnes sur grand ecran, et non quatre blocs empiles.
       *
       * L'ecran demandait 933 pixels pour six commandes a traiter, quand un
       * portable de 1366x768 n'en offre qu'environ 640 une fois la barre du
       * navigateur posee : le tableau de bord se lisait au defilement, ce
       * qui est exactement ce qu'un tableau de bord doit eviter. La largeur
       * etait pourtant libre - tout tenait dans une colonne unique.
       *
       * Ce qui presse reste a gauche, en premier dans l'ordre de lecture ;
       * les totaux et la tendance passent a droite, ou on va les chercher.
       */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-5">
        <section>
          <EnTeteSection
            titre="À traiter"
            action={
              bilan.aTraiter.length > 0 && (
                <Compteur ton={enRetard > 0 ? "probleme" : "attention"}>
                  {bilan.aTraiter.length}
                </Compteur>
              )
            }
          />

          {bilan.aTraiter.length === 0 ? (
            <Carte classe="mt-2 flex items-center gap-3 px-4 py-4">
              <CheckCircle
                size={20}
                weight="fill"
                className="shrink-0 text-vert"
                aria-hidden
              />
              <p className="text-sm text-gris">
                Rien d&apos;urgent aujourd&apos;hui. Aucun retard, aucun essayage
                prévu, aucune commande en attente de retrait.
              </p>
            </Carte>
          ) : (
            <ul className="mt-2 grid gap-2">
              {bilan.aTraiter.slice(0, A_TRAITER_MAX).map((commande) => {
                const raison = motif(commande);

                return (
                  <li key={commande.id}>
                    <CarteLien
                      href={`/commandes/${commande.id}`}
                      classe="px-4 py-3"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-encre">
                          {commande.client}
                        </span>
                        {raison && (
                          <Etiquette ton={raison.ton}>{raison.texte}</Etiquette>
                        )}
                      </span>

                      {/*
                       * La ligne du bas porte le metier : le modele, l'etape,
                       * et surtout ce qui reste du. Sans le reste a payer, il
                       * fallait ouvrir la commande pour savoir s'il y avait de
                       * l'argent a reclamer en meme temps que le vetement.
                       */}
                      <span className="mt-1 flex items-baseline justify-between gap-3">
                        <span className="truncate text-xs text-gris">
                          {commande.nom_modele ?? "Sans modèle"} ·{" "}
                          {STATUT_LABELS[commande.statut as Statut]}
                        </span>
                        <span
                          className={`chiffres shrink-0 text-xs font-medium ${
                            commande.reste > 0 ? "text-rouge" : "text-vert"
                          }`}
                        >
                          {commande.reste > 0
                            ? `reste ${formaterMontant(commande.reste)}`
                            : "soldé"}
                        </span>
                      </span>
                    </CarteLien>
                  </li>
                );
              })}
            </ul>
          )}

          {bilan.aTraiter.length > A_TRAITER_MAX && (
            <Link
              href="/commandes"
              className="mt-2 inline-block text-sm font-medium text-vert underline underline-offset-2"
            >
              Voir les {bilan.aTraiter.length - A_TRAITER_MAX} autres
            </Link>
          )}
        </section>

        {/*
         * Les trois totaux restent en bande sur telephone, ou la largeur
         * manque, et passent en colonne a cote du graphique sur grand
         * ecran : a un tiers de la moitie de la page, « 1 805 700 » ne
         * tiendrait plus dans sa carte.
         */}
        <div className="flex flex-col gap-6 lg:gap-5">
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <Vignette
              libelle="Créances"
              valeur={nombre.format(bilan.creances)}
              unite="FCFA"
              precision={
                bilan.nbImpayes > 0
                  ? `${bilan.nbImpayes} commande${bilan.nbImpayes > 1 ? "s" : ""}`
                  : "tout est soldé"
              }
              alerte={bilan.creances > 0}
            />
            <Vignette
              libelle="En cours"
              valeur={String(bilan.enCours.length)}
              precision={
                enRetard > 0 ? `dont ${enRetard} en retard` : "aucune en retard"
              }
            />
            <Vignette
              libelle="Clients"
              valeur={String(clients.length)}
              precision="au total"
            />
          </div>

          {/*
           * Le graphique ferme la colonne de droite. Il a d'abord ete loge
           * dans le panneau, a cote du montant du mois, pour eviter
           * l'aller-retour entre le chiffre et sa courbe ; mais il y
           * alourdissait le premier coup d'oeil, alors que ce qu'on vient
           * chercher le matin est ce qui presse - les retards, puis les
           * chiffres du jour. La tendance sur six mois se consulte, elle ne
           * s'annonce pas.
           */}
          <Carte classe="p-5">
            <h2 className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
              Encaissements par mois
            </h2>
            {/*
             * Consigne reservee au tactile : sur un ordinateur, on ne touche
             * pas une barre, on la survole - et le graphique porte deja son
             * curseur et sa ligne de lecture pour le dire. La retirer rend a la
             * colonne les vingt pixels qui la faisaient depasser.
             */}
            <p className="mt-1 text-xs text-gris lg:hidden">
              Touchez une barre pour voir le montant exact.
            </p>
            <div className="mt-4">
              <GraphiqueEncaissements points={bilan.points} />
            </div>
          </Carte>
        </div>
      </div>
    </>
  );
}

function SqueletteBord() {
  return (
    <div role="status" aria-label="Chargement du tableau de bord">
      <Squelette rayon="panneau" classe="h-72" />

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-24" />
        <SqueletteLigne />
        <SqueletteLigne />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Squelette rayon="carte" classe="h-24" />
        <Squelette rayon="carte" classe="h-24" />
        <Squelette rayon="carte" classe="h-24" />
      </div>
    </div>
  );
}
