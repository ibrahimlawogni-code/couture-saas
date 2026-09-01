"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Plus,
  Star,
  TrendDown,
  TrendUp,
  UserPlus,
} from "@phosphor-icons/react/dist/ssr";
import {
  formaterMontant,
  groupeEcheance,
  ponctualite,
  priorite,
  resteAPayer,
  versesParCommande,
  type Statut,
} from "@/lib/commandes";
import { formateurNombre, type Traductions } from "@/lib/i18n";
import { useDonnees } from "@/lib/offline/use-donnees";
import { useTraductions } from "@/lib/offline/use-traductions";
import { Carte, CarteLien, Panneau } from "@/ui/carte";
import { Etiquette, type TonEtiquette } from "@/ui/etiquette";
import { Jalons } from "@/ui/jalons";
import { EnTeteSection } from "@/ui/page";
import { Squelette, SqueletteLigne } from "@/ui/squelette";
import { GraphiqueEncaissements, type PointMensuel } from "./graphique";

const MOIS_AFFICHES = 6;
const A_TRAITER_MAX = 6;

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
 * Ce qui fait remonter une commande dans la liste du jour, et sous quel ton.
 *
 * L'ordre compte : une commande en retard qui a aussi un essayage
 * aujourd'hui est d'abord en retard. Le retard est le seul des quatre cas
 * ou quelque chose a deja mal tourne.
 */
function motif(
  commande: {
    niveau: string;
    livraisonAujourdhui: boolean;
    essayageAujourdhui: boolean;
    statut: string;
  },
  mots: Traductions
): { texte: string; ton: TonEtiquette } | null {
  if (commande.niveau === "en_retard")
    return { texte: mots.bord.motifs.en_retard, ton: "probleme" };
  if (commande.livraisonAujourdhui)
    return { texte: mots.bord.motifs.a_livrer, ton: "attention" };
  if (commande.essayageAujourdhui)
    return { texte: mots.bord.motifs.essayage, ton: "attention" };
  if (commande.statut === "pret")
    return { texte: mots.bord.motifs.a_retirer, ton: "metier" };
  return null;
}

export function TableauDeBord() {
  const { atelier, clients, commandes, paiements, historique, avis, chargee } =
    useDonnees();
  const mots = useTraductions();
  const nombre = formateurNombre(mots.locale);

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

    /*
     * Les livraisons du mois, comptees sur leur date reelle et non sur la
     * date prevue. L'ecran affichait un total depuis toujours, faute de
     * connaitre la date de sortie ; l'historique des statuts la porte.
     */
    const livreesCeMois = historique.filter(
      (ligne) => new Date(ligne.created_at) >= debutMois
    ).length;

    const tenue = ponctualite(commandes, historique);

    /*
     * La note moyenne. Arrondie au dixieme : au centieme, elle bougerait a
     * chaque avis et donnerait a un chiffre de douze mesures une precision
     * qu'il n'a pas.
     */
    const satisfaction =
      avis.length > 0
        ? avis.reduce((somme, a) => somme + Number(a.note), 0) / avis.length
        : null;

    /*
     * Les clients qui ont une piece en cours, parmi tous ceux du carnet.
     *
     * Le total seul ne dit pas grand-chose : un atelier de quarante clients
     * dont trois en activite n'est pas le meme qu'un atelier de quarante
     * clients dont trente. Le carnet complet reste le chiffre principal -
     * un client livre reste un client, et c'est lui qu'on rappelle a la
     * saison suivante.
     */
    const clientsActifs = new Set(enCours.map((c) => c.client_id)).size;

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
      .map((commande) => {
        const groupe = groupeEcheance(
          commande.date_livraison,
          commande.statut as Statut,
        );

        return {
          ...commande,
          client: nomsClients.get(commande.client_id) ?? mots.clientInconnu,
          niveau: priorite(commande.date_livraison, commande.statut as Statut),
          livraisonAujourdhui: groupe === "aujourdhui",
          essayageAujourdhui: memeJour(commande.date_essayage, maintenant),
          reste: resteAPayer(
            commande.prix_total,
            verseParCommande.get(commande.id) ?? 0,
          ),
        };
      })
      .filter(
        (c) =>
          c.niveau === "en_retard" ||
          c.livraisonAujourdhui ||
          c.essayageAujourdhui ||
          c.statut === "pret",
      )
      .sort((a, b) =>
        (a.date_livraison ?? "9999").localeCompare(b.date_livraison ?? "9999"),
      );

    /*
     * Le chiffre d'accroche de l'ecran : ce qui doit sortir de l'atelier
     * aujourd'hui, retards compris. Une piece en retard reste une piece a
     * livrer - la sortir du compte donnerait un « 1 » rassurant a un
     * atelier qui en doit quatre depuis la semaine derniere. La pastille
     * dit ensuite combien sont en retard.
     */
    const aLivrer = enCours.filter((c) => {
      const groupe = groupeEcheance(c.date_livraison, c.statut as Statut);
      return groupe === "en_retard" || groupe === "aujourdhui";
    }).length;

    const enRetard = enCours.filter(
      (c) =>
        groupeEcheance(c.date_livraison, c.statut as Statut) === "en_retard",
    ).length;

    const essayages = enCours.filter((c) =>
      memeJour(c.date_essayage, maintenant),
    ).length;

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
          .toLocaleDateString(mots.locale, { month: "short" })
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
      livreesCeMois,
      tenue,
      satisfaction,
      nbAvis: avis.length,
      clientsActifs,
      creances,
      nbImpayes,
      aTraiter,
      aLivrer,
      enRetard,
      essayages,
      points,
      ecart,
      moisPrecedent: precedent?.libelle ?? "",
    };
    // mots.locale en dependance : les libelles de mois du graphique en
    // dependent, et ils resteraient en francais apres un changement de
    // langue sans rechargement.
  }, [
    clients,
    commandes,
    paiements,
    historique,
    avis,
    mots.locale,
    mots.clientInconnu,
  ]);

  if (!chargee) return <SqueletteBord mots={mots} />;

  const heure = new Date().getHours();
  const salutation =
    heure < 18 ? mots.bord.salutationJour : mots.bord.salutationSoir;

  return (
    <>
      {/*
       * Le panneau porte le chiffre d'accroche de l'ecran.
       *
       * C'etait « Encaissé ce mois ». Un tailleur qui ouvre l'application
       * le matin ne se demande pas ce qu'il a encaisse depuis le 1er : il
       * se demande ce qui doit sortir de l'atelier aujourd'hui. L'argent du
       * mois n'a pas disparu, il est redescendu dans sa carte, avec la
       * courbe qui lui donne son sens - une question qu'on se pose une fois
       * par mois n'a pas a occuper le premier regard de chaque jour.
       */}
      <Panneau classe="p-5 lg:p-6">
        <div className="lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="lg:min-w-0 lg:flex-1">
            <p className="text-sm text-vert-pale">
              {salutation}
              {atelier?.nom ? `, ${atelier.nom}` : ""} ·{" "}
              {new Date().toLocaleDateString(mots.locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>

            {/*
             * Chiffres proportionnels, jamais tabulaires : la chasse fixe
             * donne a chaque chiffre la largeur d'un zero, ce qui distend
             * visiblement un « 3 » de cette taille.
             */}
            <p className="mt-3.5 flex items-baseline gap-2.5">
              <span className="text-5xl leading-[0.85] font-semibold tracking-tight">
                {bilan.aLivrer}
              </span>
              <span className="max-w-36 text-[0.9375rem] leading-tight font-medium">
                {mots.bord.aLivrer(bilan.aLivrer)}
              </span>
            </p>

            <div className="mt-3.5 flex flex-wrap gap-2">
              {bilan.enRetard > 0 && (
                <Etiquette ton="probleme">
                  {mots.bord.enRetard(bilan.enRetard)}
                </Etiquette>
              )}
              {bilan.essayages > 0 && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white">
                  {mots.bord.essayages(bilan.essayages)}
                </span>
              )}
              {bilan.enRetard === 0 && bilan.essayages === 0 && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white">
                  <CheckCircle size={13} weight="fill" aria-hidden />
                  {mots.bord.aucunRetard}
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:mt-0 lg:shrink-0 lg:flex-col xl:flex-row">
            <Link
              href="/commandes/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-controle bg-white px-5 text-sm font-medium text-foret transition-colors duration-150 ease-doux hover:bg-vert-clair"
            >
              <Plus size={16} weight="bold" />
              {mots.bord.nouvelleCommande}
            </Link>
            <Link
              href="/clients/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-controle border border-white/25 px-5 text-sm font-medium text-white transition-colors duration-150 ease-doux hover:bg-white/10"
            >
              <UserPlus size={16} />
              {mots.bord.nouveauClient}
            </Link>
          </div>
        </div>
      </Panneau>

      {/*
       * Deux colonnes sur grand ecran, et non quatre blocs empiles.
       *
       * Ce qui presse reste a gauche, en premier dans l'ordre de lecture ;
       * les totaux et la tendance passent a droite, ou on va les chercher.
       */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-5">
        <section>
          <EnTeteSection
            titre={mots.bord.aTraiter}
            action={
              bilan.aTraiter.length > A_TRAITER_MAX && (
                <Link
                  href="/commandes"
                  className="rounded-controle text-xs font-medium text-vert hover:text-foret"
                >
                  {mots.bord.toutVoir}
                </Link>
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
                {mots.bord.rienUrgent}
              </p>
            </Carte>
          ) : (
            <ul className="mt-2 grid gap-2">
              {bilan.aTraiter.slice(0, A_TRAITER_MAX).map((commande) => {
                const raison = motif(commande, mots);

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
                          {commande.nom_modele ?? mots.sansModele} ·{" "}
                          {mots.statuts[commande.statut as Statut]}
                        </span>
                        <span
                          className={`chiffres shrink-0 text-xs font-medium ${
                            commande.reste > 0 ? "text-rouge" : "text-vert"
                          }`}
                        >
                          {commande.reste > 0
                            ? mots.reste(formaterMontant(commande.reste, mots.locale))
                            : mots.solde}
                        </span>
                      </span>

                      <span className="mt-2.5 block">
                        <Jalons statut={commande.statut as Statut} mots={mots} />
                      </span>
                    </CarteLien>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-4 lg:gap-5">
          {/*
           * Les creances gardent une carte a elles. Elles partageaient une
           * bande de trois vignettes avec le nombre de commandes en cours et
           * le nombre de clients, tous trois du meme poids visuel - alors
           * qu'une seule des trois appelle une action. Les deux autres sont
           * des reperes, et sont redescendus sur une ligne de texte.
           */}
          <Carte
            classe={`p-5 ${bilan.creances > 0 ? "border-rouge-clair bg-rouge-clair/40" : ""}`}
          >
            <h2 className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
              {mots.bord.creances}
            </h2>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-[2.125rem] leading-none font-semibold tracking-tight ${
                  bilan.creances > 0 ? "text-rouge" : "text-encre"
                }`}
              >
                {nombre.format(bilan.creances)}
              </span>
              <span className="text-xs text-gris">FCFA</span>
            </p>
            <p className="mt-2 text-xs text-gris">
              {bilan.nbImpayes > 0
                ? mots.bord.surCommandes(bilan.nbImpayes)
                : mots.bord.toutSolde}
            </p>

            {bilan.nbImpayes > 0 && (
              <Link
                href="/finances"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-controle bg-rouge px-4 text-sm font-medium text-white transition-colors duration-150 ease-doux hover:bg-encre"
              >
                {mots.bord.relancer}
                <ArrowRight size={15} weight="bold" />
              </Link>
            )}
          </Carte>

          {/*
           * Le carnet de clients a sa carte.
           *
           * Il tenait dans la ligne de reperes en dessous, ou il se lisait
           * comme une statistique parmi d'autres. C'est pourtant le seul
           * chiffre du tableau de bord qui ne redescend jamais : une
           * commande se livre et sort des comptes, un client livre reste
           * au carnet, et c'est lui qu'on rappelle a la saison suivante.
           */}
          <Carte classe="p-5">
            <h2 className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
              {mots.bord.clients}
            </h2>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[2.125rem] leading-none font-semibold tracking-tight text-encre">
                {clients.length}
              </span>
              <span className="text-xs text-gris">
                {mots.bord.auTotal}
              </span>
            </p>
            <p className="mt-2 text-xs text-gris">
              {clients.length === 0
                ? mots.bord.aucunClient
                : bilan.clientsActifs > 0
                  ? mots.bord.avecPieceEnCours(bilan.clientsActifs)
                  : mots.bord.aucunePieceEnCours}
            </p>
          </Carte>

          <Evaluation
            tenue={bilan.tenue}
            satisfaction={bilan.satisfaction}
            nbAvis={bilan.nbAvis}
            mots={mots}
          />

          {/*
           * Deux reperes sur une ligne. Ils ne demandent aucune decision :
           * leur donner une carte chacun leur pretait une urgence qu'ils
           * n'ont pas, et repoussait la courbe sous la ligne de flottaison.
           */}
          <p className="chiffres px-1 text-xs text-gris">
            <span className="font-semibold text-encre">
              {bilan.enCours.length}
            </span>{" "}
            {mots.bord.commandesEnCours(bilan.enCours.length)} ·{" "}
            <span className="font-semibold text-encre">
              {bilan.livreesCeMois}
            </span>{" "}
            {mots.bord.livreesCeMois(bilan.livreesCeMois)}
          </p>

          {/*
           * L'argent du mois et sa courbe dans la meme carte : le montant
           * seul ne dit pas si le mois est bon, c'est la comparaison qui
           * porte l'information.
           */}
          <Carte classe="p-5">
            <h2 className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
              {mots.bord.encaisseCeMois}
            </h2>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[2.125rem] leading-none font-semibold tracking-tight text-encre">
                {nombre.format(bilan.encaisseMois)}
              </span>
              <span className="text-xs text-gris">FCFA</span>
            </p>

            {bilan.ecart !== null && (
              <p
                className={`mt-2 flex items-center gap-1.5 text-xs ${
                  bilan.ecart >= 0 ? "text-vert" : "text-ambre"
                }`}
              >
                {bilan.ecart >= 0 ? (
                  <TrendUp size={13} weight="bold" aria-hidden />
                ) : (
                  <TrendDown size={13} weight="bold" aria-hidden />
                )}
                <span>
                  {bilan.ecart >= 0 ? "+" : "−"}
                  {Math.abs(Math.round(bilan.ecart))} %{" "}
                  {mots.bord.surLeMois(bilan.moisPrecedent)}
                </span>
              </p>
            )}

            {/*
             * Consigne reservee au tactile : sur un ordinateur, on ne touche
             * pas une barre, on la survole - et le graphique porte deja son
             * curseur et sa ligne de lecture pour le dire.
             */}
            <p className="mt-4 text-xs text-gris lg:hidden">
              {mots.bord.toucherBarre}
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

/*
 * La tenue des delais, en une jauge.
 *
 * C'est le seul indicateur du produit qui juge le travail plutot que
 * l'argent, et le seul qu'un tailleur puisse montrer a un client.
 *
 * Les trois seuils suivent la grammaire de couleur de la marque plutot
 * qu'une echelle inventee : le vert dit que le metier est tenu, l'ambre
 * qu'une echeance approche du bord, le rouge qu'il y a un probleme. Un
 * atelier qui rate une piece sur trois a un probleme, pas une nuance.
 */
const SEUIL_BON = 90;
const SEUIL_PASSABLE = 70;

function Evaluation({
  tenue,
  satisfaction,
  nbAvis,
  mots,
}: {
  tenue: {
    mesurees: number;
    aTemps: number;
    part: number | null;
    retardMoyen: number;
  };
  satisfaction: number | null;
  nbAvis: number;
  mots: Traductions;
}) {
  const ton =
    tenue.part === null
      ? null
      : tenue.part >= SEUIL_BON
        ? { texte: "text-vert", fond: "bg-vert" }
        : tenue.part >= SEUIL_PASSABLE
          ? { texte: "text-ambre", fond: "bg-ambre" }
          : { texte: "text-rouge", fond: "bg-rouge" };

  const retard = tenue.mesurees - tenue.aTemps;

  return (
    <Carte classe="p-5">
      <h2 className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
        {mots.bord.evaluation}
      </h2>

      {/* --- Ce que l'atelier tient : les delais ------------------------ */}
      <div className="mt-3">
        <p className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-gris">{mots.bord.ponctualite}</span>
          {tenue.part === null ? (
            <span className="text-sm text-gris">—</span>
          ) : (
            <span
              className={`text-2xl leading-none font-semibold tracking-tight ${ton!.texte}`}
            >
              {tenue.part} %
            </span>
          )}
        </p>

        {tenue.part === null ? (
          <p className="mt-1.5 text-xs leading-relaxed text-gris">
            {mots.bord.ponctualiteVide}
          </p>
        ) : (
          <>
            {/*
             * La jauge double le pourcentage plutot que de le remplacer :
             * elle se lit d'un coup d'oeil, mais elle ne porte aucune
             * information que le chiffre ne donne pas, d'ou l'aria-hidden.
             */}
            <div
              aria-hidden
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-bordure"
            >
              <div
                className={`h-full rounded-full ${ton!.fond}`}
                style={{ width: `${tenue.part}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gris">
              {mots.bord.surPiecesLivrees(tenue.mesurees)}
              {retard > 0 &&
                mots.bord.retardMoyen(
                  tenue.retardMoyen.toLocaleString(mots.locale, {
                    maximumFractionDigits: 1,
                  }),
                  tenue.retardMoyen
                )}
            </p>
          </>
        )}
      </div>

      <div className="my-4 h-px bg-bordure" />

      {/* --- Ce que les clients en disent ------------------------------- */}
      <div>
        <p className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-gris">{mots.bord.satisfaction}</span>
          {satisfaction === null ? (
            <span className="text-sm text-gris">—</span>
          ) : (
            <span className="flex items-baseline gap-1.5">
              <span className="text-2xl leading-none font-semibold tracking-tight text-encre">
                {satisfaction.toLocaleString(mots.locale, {
                  maximumFractionDigits: 1,
                })}
              </span>
              <span className="text-xs text-gris">{mots.bord.surCinq}</span>
            </span>
          )}
        </p>

        {satisfaction === null ? (
          <p className="mt-1.5 text-xs leading-relaxed text-gris">
            {mots.bord.satisfactionVide}
          </p>
        ) : (
          <>
            <p aria-hidden className="mt-2 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((rang) => (
                <Star
                  key={rang}
                  size={15}
                  weight={rang <= Math.round(satisfaction) ? "fill" : "regular"}
                  className={
                    rang <= Math.round(satisfaction)
                      ? "text-ambre"
                      : "text-bordure"
                  }
                />
              ))}
            </p>
            <p className="mt-2 text-xs text-gris">
              {mots.bord.surAvis(nbAvis)}
            </p>
          </>
        )}
      </div>
    </Carte>
  );
}

function SqueletteBord({ mots }: { mots: Traductions }) {
  return (
    <div role="status" aria-label={mots.bord.chargement}>
      <Squelette rayon="panneau" classe="h-56" />

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-40" />
        <SqueletteLigne />
        <SqueletteLigne />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <Squelette rayon="carte" classe="h-36" />
        <Squelette rayon="carte" classe="h-48" />
      </div>
    </div>
  );
}
