"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import {
  STATUTS,
  STATUT_LABELS,
  TON_PRIORITE,
  formaterMontant,
  priorite,
  resteAPayer,
  statutSuivant,
  versesParCommande,
  type Statut,
} from "@/lib/commandes";
import { rafraichirMiroir } from "@/lib/offline/miroir";
import { useDonnees } from "@/lib/offline/use-donnees";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { Carte } from "@/ui/carte";
import { Compteur, Etiquette } from "@/ui/etiquette";
import { EtatVide } from "@/ui/etat-vide";
import { LienBouton } from "@/ui/bouton";
import { Squelette } from "@/ui/squelette";

const LIVREES_AFFICHEES = 20;

export function TableauCommandes() {
  const { clients, commandes, paiements, chargee } = useDonnees();
  const { horsLigne } = useFileAttente();

  const nomsClients = useMemo(
    () => new Map(clients.map((client) => [client.id, client.nom])),
    [clients]
  );

  /*
   * Ce qui a deja ete verse, commande par commande.
   *
   * La carte n'affichait que le prix total, ce qui ne dit rien de ce
   * qu'il reste a encaisser. Or c'est la question qui se pose au moment
   * de remettre le vetement, et elle obligeait a ouvrir la commande.
   */
  const verseParCommande = useMemo(
    () => versesParCommande(paiements),
    [paiements]
  );

  const parStatut = useMemo(() => {
    const groupes = new Map<Statut, typeof commandes>();

    for (const statut of STATUTS) {
      const cartes = commandes
        .filter((commande) => (commande.statut as Statut) === statut)
        .sort((a, b) => {
          const dateA = a.date_livraison ?? "9999";
          const dateB = b.date_livraison ?? "9999";
          return dateA.localeCompare(dateB);
        });

      groupes.set(
        statut,
        statut === "livre" ? cartes.slice(0, LIVREES_AFFICHEES) : cartes
      );
    }

    return groupes;
  }, [commandes]);

  const enCours = commandes.filter((commande) => commande.statut !== "livre").length;

  /**
   * L'avancement passe par le reseau : c'est une modification, pas une
   * creation, et la file locale ne gere que les creations.
   */
  async function avancer(commandeId: string, statut: Statut) {
    const supabase = createClient();
    const { error } = await supabase
      .from("commandes")
      .update({ statut })
      .eq("id", commandeId);

    if (!error) await rafraichirMiroir();
  }

  if (!chargee) return <SqueletteTableau />;

  if (commandes.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4">
        <EtatVide
          icone={ClipboardText}
          titre="Aucune commande"
          texte="Chaque commande suit son avancement ici, de la réception à la livraison."
          action={
            <LienBouton href="/commandes/new">Créer la première commande</LienBouton>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4">
        <p className="text-sm text-gris">{enCours} en cours</p>

        {/*
         * Posee avant le tableau, et non apres : c'est elle qui explique
         * les boutons grises, et placee en fin d'ecran elle se serait
         * trouvee derriere sept colonnes a defilement horizontal.
         */}
        {horsLigne && (
          <p className="mt-1 text-xs text-gris">
            Hors connexion : l&apos;avancement des commandes reprendra au retour
            du réseau.
          </p>
        )}
      </div>

      {/*
       * Colonnes qui defilent au doigt : sept colonnes ne tiennent pas
       * sur un ecran de telephone. L'accroche au defilement les fait se
       * poser bord a bord plutot que de s'arreter a mi-chemin, ce qui
       * laissait deux demi-colonnes a l'ecran et perdait le fil.
       */}
      <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4">
        {STATUTS.map((statut) => {
          const cartes = parStatut.get(statut) ?? [];

          return (
            <section key={statut} className="w-64 shrink-0 snap-start">
              <div className="flex items-center justify-between gap-2 px-1">
                <h2 className="truncate text-sm font-semibold text-encre">
                  {STATUT_LABELS[statut]}
                </h2>
                {/*
                 * Le compteur portait du gris sur du vert clair, soit
                 * 3,71:1 - sous le seuil AA. Le ton « metier » de
                 * l'etiquette pose du vert foret sur le meme fond, a
                 * 10,3:1.
                 */}
                <Compteur ton={cartes.length > 0 ? "metier" : "neutre"}>
                  {cartes.length}
                </Compteur>
              </div>

              <ul className="mt-2 flex flex-col gap-2">
                {cartes.map((commande) => {
                  const niveau = priorite(
                    commande.date_livraison,
                    commande.statut as Statut
                  );
                  const suivant = statutSuivant(commande.statut as Statut);
                  const provisoire = commande.enAttente || commande.enEchec;
                  const reste = resteAPayer(
                    commande.prix_total,
                    verseParCommande.get(commande.id) ?? 0
                  );

                  return (
                    <li key={commande.id}>
                      <Carte provisoire={provisoire} classe="p-3">
                        <Link
                          href={`/commandes/${commande.id}`}
                          className="block rounded-controle"
                        >
                          <p className="truncate text-sm font-medium text-encre">
                            {nomsClients.get(commande.client_id) ?? "Client inconnu"}
                          </p>
                          <p className="truncate text-xs text-gris">
                            {commande.nom_modele ?? "Sans modèle"}
                          </p>

                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            {commande.enEchec ? (
                              <Etiquette ton="probleme">Refusé</Etiquette>
                            ) : commande.enAttente ? (
                              <Etiquette ton="systeme">En attente</Etiquette>
                            ) : (
                              <Etiquette ton={TON_PRIORITE[niveau]}>
                                {commande.date_livraison
                                  ? new Date(
                                      commande.date_livraison
                                    ).toLocaleDateString("fr-FR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                    })
                                  : "Sans date"}
                              </Etiquette>
                            )}
                            {/*
                             * Les montants d'une colonne se lisent les uns
                             * sous les autres : chasse fixe pour qu'ils
                             * s'alignent au chiffre pres.
                             */}
                            <span className="chiffres text-xs text-gris">
                              {formaterMontant(Number(commande.prix_total))}
                            </span>
                          </div>

                          {/*
                           * Le solde restant, sous le prix. « Soldé » est
                           * dit en toutes lettres plutot que laisse a
                           * deviner d'une absence : sur la colonne « Prêt
                           * à retirer », savoir s'il reste a encaisser
                           * change ce qu'on dit au client en lui remettant
                           * sa piece.
                           */}
                          {!provisoire && Number(commande.prix_total) > 0 && (
                            <p
                              className={`chiffres mt-1 text-right text-[11px] font-medium ${
                                reste > 0 ? "text-rouge" : "text-vert"
                              }`}
                            >
                              {reste > 0
                                ? `reste ${formaterMontant(reste)}`
                                : "soldé"}
                            </p>
                          )}
                        </Link>

                        {suivant && !provisoire && (
                          <button
                            type="button"
                            onClick={() => avancer(commande.id, suivant)}
                            disabled={horsLigne}
                            /*
                             * L'explication du grisage est en clair sous
                             * le tableau, pas dans un title. Un title sur
                             * un bouton desactive ne s'affiche jamais :
                             * le survol n'atteint pas l'element, d'autant
                             * moins ici que la classe pose
                             * pointer-events-none - et sur un telephone
                             * il n'y a de toute facon pas de survol.
                             */
                            className="mt-2.5 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-controle border border-bordure text-xs font-medium text-gris transition-colors duration-150 ease-doux hover:border-vert-clair hover:bg-papier hover:text-encre disabled:pointer-events-none disabled:opacity-40"
                          >
                            {STATUT_LABELS[suivant]}
                            <ArrowRight size={12} weight="bold" />
                          </button>
                        )}
                      </Carte>
                    </li>
                  );
                })}

                {cartes.length === 0 && (
                  <li className="rounded-carte border border-dashed border-bordure py-8 text-center text-xs text-gris">
                    Vide
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

    </>
  );
}

function SqueletteTableau() {
  return (
    <div
      role="status"
      aria-label="Chargement des commandes"
      className="mt-4 flex gap-3 overflow-hidden px-4"
    >
      {[0, 1, 2].map((colonne) => (
        <div key={colonne} className="w-64 shrink-0">
          <div className="flex items-center justify-between px-1">
            <Squelette classe="h-3.5 w-20" />
            <Squelette rayon="rond" classe="size-5" />
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {[0, 1].map((carte) => (
              <div
                key={carte}
                className="flex flex-col gap-2 rounded-carte border border-bordure bg-white p-3"
              >
                <Squelette classe="h-3.5 w-3/5" />
                <Squelette classe="h-3 w-2/5" />
                <Squelette classe="mt-1 h-6 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
