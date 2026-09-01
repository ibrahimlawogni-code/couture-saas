"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import {
  GROUPES_ECHEANCE,
  STATUTS,
  TON_GROUPE,
  formaterMontant,
  groupeEcheance,
  resteAPayer,
  statutSuivant,
  versesParCommande,
  type GroupeEcheance,
  type Statut,
} from "@/lib/commandes";
import type { Traductions } from "@/lib/i18n";
import { rafraichirMiroir } from "@/lib/offline/miroir";
import { useDonnees } from "@/lib/offline/use-donnees";
import { useTraductions } from "@/lib/offline/use-traductions";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { Carte } from "@/ui/carte";
import { Compteur, Etiquette } from "@/ui/etiquette";
import { EtatVide } from "@/ui/etat-vide";
import { Jalons, Repartition } from "@/ui/jalons";
import { LienBouton } from "@/ui/bouton";
import { Squelette } from "@/ui/squelette";

const LIVREES_AFFICHEES = 20;

/*
 * Six secondes pour se raviser.
 *
 * Assez pour lire ce qui vient de se passer et revenir dessus, trop court
 * pour qu'un bandeau traine sur l'ecran pendant qu'on travaille. C'est ce
 * delai qui remplace la boite de confirmation : une main occupee n'a pas a
 * confirmer deux fois, elle a besoin de pouvoir se tromper.
 */
const DUREE_ANNULATION = 6000;

export function TableauCommandes() {
  const { clients, commandes, paiements, chargee } = useDonnees();
  const mots = useTraductions();
  const { horsLigne } = useFileAttente();

  const [annulation, setAnnulation] = useState<{
    id: string;
    client: string;
    avant: Statut;
    apres: Statut;
  } | null>(null);

  useEffect(() => {
    if (!annulation) return;
    const minuteur = setTimeout(() => setAnnulation(null), DUREE_ANNULATION);
    return () => clearTimeout(minuteur);
  }, [annulation]);

  const nomsClients = useMemo(
    () => new Map(clients.map((client) => [client.id, client.nom])),
    [clients]
  );

  /*
   * Ce qui a deja ete verse, commande par commande.
   *
   * La ligne n'affichait que le prix total, ce qui ne dit rien de ce
   * qu'il reste a encaisser. Or c'est la question qui se pose au moment
   * de remettre le vetement, et elle obligeait a ouvrir la commande.
   */
  const verseParCommande = useMemo(
    () => versesParCommande(paiements),
    [paiements]
  );

  const { groupes, parEtape, enCours } = useMemo(() => {
    const lignes = commandes.map((commande) => {
      const statut = commande.statut as Statut;

      return {
        ...commande,
        statut,
        client: nomsClients.get(commande.client_id) ?? mots.clientInconnu,
        groupe: groupeEcheance(commande.date_livraison, statut),
        suivant: statutSuivant(statut),
        reste: resteAPayer(
          commande.prix_total,
          verseParCommande.get(commande.id) ?? 0
        ),
      };
    });

    const groupes = new Map<GroupeEcheance, typeof lignes>();
    for (const groupe of GROUPES_ECHEANCE) {
      const dedans = lignes
        .filter((ligne) => ligne.groupe === groupe)
        .sort((a, b) =>
          (a.date_livraison ?? "9999").localeCompare(b.date_livraison ?? "9999")
        );

      if (dedans.length === 0) continue;

      groupes.set(
        groupe,
        groupe === "livre" ? dedans.slice(0, LIVREES_AFFICHEES) : dedans
      );
    }

    const parEtape: Record<string, number> = {};
    for (const statut of STATUTS) parEtape[statut] = 0;
    for (const ligne of lignes) parEtape[ligne.statut] += 1;

    return {
      groupes,
      parEtape,
      enCours: lignes.filter((ligne) => ligne.statut !== "livre").length,
    };
  }, [commandes, nomsClients, verseParCommande, mots.clientInconnu]);

  /**
   * L'avancement passe par le reseau : c'est une modification, pas une
   * creation, et la file locale ne gere que les creations.
   */
  async function changerStatut(id: string, statut: Statut) {
    const supabase = createClient();
    const { error } = await supabase
      .from("commandes")
      .update({ statut })
      .eq("id", id);

    if (!error) await rafraichirMiroir();
    return !error;
  }

  async function avancer(
    commande: { id: string; client: string; statut: Statut },
    suivant: Statut
  ) {
    const parti = await changerStatut(commande.id, suivant);
    if (!parti) return;

    setAnnulation({
      id: commande.id,
      client: commande.client,
      avant: commande.statut,
      apres: suivant,
    });
  }

  async function annuler() {
    if (!annulation) return;
    const retour = annulation;
    setAnnulation(null);
    await changerStatut(retour.id, retour.avant);
  }

  if (!chargee) return <SqueletteTableau mots={mots} />;

  if (commandes.length === 0) {
    return (
      <EtatVide
        icone={ClipboardText}
        titre={mots.commandes.aucune}
        texte={mots.commandes.aucuneTexte}
        action={
          <LienBouton href="/commandes/new">
            {mots.commandes.creerPremiere}
          </LienBouton>
        }
      />
    );
  }

  return (
    <>
      <p className="text-sm text-gris">{mots.commandes.enCours(enCours)}</p>

      {horsLigne && (
        <p className="mt-1 text-xs text-gris">
          {mots.commandes.horsLigne}
        </p>
      )}

      {/*
       * La repartition remplace la vue d'ensemble que donnaient les sept
       * colonnes du Kanban, en une ligne au lieu d'un ecran entier. C'est
       * la seule chose que les colonnes faisaient mieux qu'une liste, et
       * elle tient ici au-dessus du pli.
       */}
      <Carte classe="mt-4 p-4">
        <h2 className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
          {mots.commandes.ouEnEst}
        </h2>
        <div className="mt-2.5">
          <Repartition parEtape={parEtape} mots={mots} />
        </div>
      </Carte>

      {/*
       * Groupees par echeance, et non par etape.
       *
       * Sept colonnes en defilement horizontal n'en montraient qu'une et
       * demie sur un telephone de 390 px, sans jamais dire ou l'on se
       * trouvait dans la chaine. La question de trois secondes - qu'est-ce
       * que je dois sortir aujourd'hui - n'avait aucune reponse a l'ecran.
       * La chaine reste entierement lisible, ligne par ligne, dans les sept
       * jalons.
       */}
      <div className="mt-6 flex flex-col gap-6">
        {[...groupes].map(([groupe, lignes]) => (
          <section key={groupe}>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-gris uppercase">
                {mots.groupes[groupe]}
              </h2>
              <Compteur ton={TON_GROUPE[groupe]}>{lignes.length}</Compteur>
            </div>

            <ul className="mt-2 flex flex-col gap-2">
              {lignes.map((commande) => {
                const provisoire = commande.enAttente || commande.enEchec;

                /*
                 * Ecrites une fois, posees a deux endroits : empilees a
                 * droite du nom sur telephone, en colonnes propres sur
                 * grand ecran.
                 */
                const etiquetteDate = commande.enEchec ? (
                  <Etiquette ton="probleme">{mots.refuse}</Etiquette>
                ) : commande.enAttente ? (
                  <Etiquette ton="systeme">{mots.enAttente}</Etiquette>
                ) : (
                  <Etiquette ton={TON_GROUPE[groupe]}>
                    {commande.date_livraison
                      ? new Date(commande.date_livraison).toLocaleDateString(
                          mots.locale,
                          { day: "2-digit", month: "2-digit" }
                        )
                      : mots.commandes.sansDate}
                  </Etiquette>
                );

                const montantReste =
                  !provisoire && Number(commande.prix_total) > 0 ? (
                    <span
                      className={`chiffres text-xs font-medium ${
                        commande.reste > 0 ? "text-rouge" : "text-vert"
                      }`}
                    >
                      {commande.reste > 0
                        ? mots.reste(formaterMontant(commande.reste))
                        : mots.solde}
                    </span>
                  ) : null;

                return (
                  <li key={commande.id}>
                    <Carte provisoire={provisoire} classe="p-3 lg:px-4">
                      <div className="lg:flex lg:items-center lg:gap-4">
                        <div className="flex items-start justify-between gap-3 lg:w-56 lg:shrink-0 lg:items-center">
                          {/* Le corps de la ligne ouvre le detail : c'est
                              la plus grande cible, pour l'action la plus
                              frequente apres l'avancement. */}
                          <Link
                            href={`/commandes/${commande.id}`}
                            className="min-w-0 flex-1 rounded-controle"
                          >
                            <span className="block truncate text-sm font-medium text-encre">
                              {commande.client}
                            </span>
                            <span className="block truncate text-xs text-gris">
                              {commande.nom_modele ?? mots.sansModele}
                            </span>
                          </Link>

                          <span className="flex shrink-0 flex-col items-end gap-1 lg:hidden">
                            {etiquetteDate}
                            {montantReste}
                          </span>
                        </div>

                        <span className="hidden shrink-0 lg:block">
                          {etiquetteDate}
                        </span>
                        <span className="hidden lg:block lg:w-32 lg:shrink-0 lg:text-right">
                          {montantReste}
                        </span>

                        <div className="mt-2.5 flex items-center gap-3 lg:mt-0 lg:min-w-0 lg:flex-1">
                          <Jalons statut={commande.statut} mots={mots} />
                          <span className="hidden truncate text-xs text-gris lg:inline">
                            {mots.statuts[commande.statut]}
                          </span>

                          {commande.suivant && !provisoire && (
                            /*
                             * Le bouton porte le nom de l'etape suivante
                             * plutot que le mot « Avancer » : on sait ce
                             * qu'on declenche avant d'appuyer. Et il fait
                             * 44 px, dans la ligne, a portee du pouce -
                             * il fallait auparavant ouvrir la commande.
                             */
                            <button
                              type="button"
                              onClick={() =>
                                avancer(commande, commande.suivant as Statut)
                              }
                              disabled={horsLigne}
                              className="ml-auto flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-controle bg-vert-clair px-3.5 text-xs font-semibold text-foret transition-colors duration-150 ease-doux hover:bg-vert hover:text-white disabled:pointer-events-none disabled:opacity-40"
                            >
                              {mots.statuts[commande.suivant]}
                              <ArrowRight size={13} weight="bold" />
                            </button>
                          )}
                        </div>
                      </div>
                    </Carte>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/*
       * Le bandeau d'annulation, au-dessus des onglets sur telephone.
       *
       * Il remplace la confirmation qu'on posait avant d'agir : appuyer est
       * immediat, et c'est le retour en arriere qui est offert. Une piece
       * avancee par erreur se repare en une touche, sans avoir ralenti les
       * dizaines de fois ou le geste etait le bon.
       */}
      {annulation && (
        <div
          role="status"
          className="sur-fond-sombre fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-carte bg-foret px-4 py-3 text-white shadow-flottant lg:bottom-6"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {annulation.client}
            </span>
            <span className="block truncate text-xs text-vert-pale">
              {mots.commandes.passeA(mots.statuts[annulation.apres])}
            </span>
          </span>
          <button
            type="button"
            onClick={annuler}
            className="min-h-11 shrink-0 rounded-controle border border-white/25 px-3.5 text-sm font-medium transition-colors duration-150 ease-doux hover:bg-white/10"
          >
            {mots.annuler}
          </button>
        </div>
      )}
    </>
  );
}

function SqueletteTableau({ mots }: { mots: Traductions }) {
  return (
    <div role="status" aria-label={mots.commandes.chargement}>
      <Squelette classe="h-4 w-24" />
      <Squelette rayon="carte" classe="mt-4 h-24" />

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-28" />
        {[0, 1, 2].map((ligne) => (
          <div
            key={ligne}
            className="flex flex-col gap-2 rounded-carte border border-bordure bg-white p-3"
          >
            <Squelette classe="h-3.5 w-2/5" />
            <Squelette classe="h-3 w-1/3" />
            <Squelette classe="mt-1 h-11 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
