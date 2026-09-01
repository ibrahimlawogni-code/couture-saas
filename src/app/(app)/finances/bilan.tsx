"use client";

import { useMemo } from "react";
import { CheckCircle, TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";
import {
  formaterMontant,
  partVersee,
  resteAPayer,
  versesParCommande,
  type Statut,
} from "@/lib/commandes";
import { useDonnees } from "@/lib/offline/use-donnees";
import { useTraductions } from "@/lib/offline/use-traductions";
import { Carte, CarteLien, Panneau } from "@/ui/carte";
import { EnTeteSection } from "@/ui/page";
import {
  METHODE_LABELS,
  repartitionParMethode,
} from "@/lib/paiements";
import { Squelette, SqueletteLigne } from "@/ui/squelette";
import { Vignette } from "@/ui/vignette";

const nombre = new Intl.NumberFormat("fr-FR");

/*
 * Trois nuances de la meme famille, et non trois couleurs de la palette.
 *
 * Le moyen de paiement ne porte aucun jugement : ni probleme, ni
 * avertissement, ni parole du systeme. Prendre le rouge ou le bleu pour
 * distinguer Mobile Money des especes dirait quelque chose de faux.
 */
const TEINTES_METHODE = {
  especes: "bg-foret",
  mobile_money: "bg-vert",
  virement: "bg-vert-pale",
} as const;

function debutDuMois(recul = 0) {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() - recul, 1);
}

export function BilanFinancier() {
  const { clients, commandes, paiements, chargee } = useDonnees();
  const mots = useTraductions();

  const bilan = useMemo(() => {
    const debutMois = debutDuMois();
    const debutPrecedent = debutDuMois(1);
    const estDeCeMois = (date: string) => new Date(date) >= debutMois;

    const paiementsDuMois = paiements.filter((paiement) =>
      estDeCeMois(paiement.created_at)
    );

    const encaisseMois = paiementsDuMois.reduce(
      (somme, paiement) => somme + Number(paiement.montant),
      0
    );

    /*
     * Par quel moyen l'argent du mois est arrive.
     *
     * Sur les versements anterieurs a la saisie du moyen, la base a pose
     * « especes » par defaut sans que personne l'ait dit : la repartition
     * ne devient fiable qu'a mesure que de nouveaux versements arrivent.
     */
    const repartition = repartitionParMethode(paiementsDuMois);

    // Le mois precedent en entier, pour situer celui en cours.
    const encaissePrecedent = paiements
      .filter((paiement) => {
        const date = new Date(paiement.created_at);
        return date >= debutPrecedent && date < debutMois;
      })
      .reduce((somme, paiement) => somme + Number(paiement.montant), 0);

    const acomptesMois = paiements
      .filter(
        (paiement) => paiement.type === "acompte" && estDeCeMois(paiement.created_at)
      )
      .reduce((somme, paiement) => somme + Number(paiement.montant), 0);

    const commandesMois = commandes.filter((commande) =>
      estDeCeMois(commande.created_at)
    );
    const valeurCommandesMois = commandesMois.reduce(
      (somme, commande) => somme + Number(commande.prix_total),
      0
    );

    // Ce qui reste du sur chaque commande, livree ou non : une commande
    // remise sans solde reste une creance.
    const verseParCommande = versesParCommande(paiements);

    const nomsClients = new Map(clients.map((client) => [client.id, client.nom]));

    const impayes = commandes
      .map((commande) => {
        const prix = Number(commande.prix_total);
        const verse = verseParCommande.get(commande.id) ?? 0;
        return {
          ...commande,
          client: nomsClients.get(commande.client_id) ?? "Client inconnu",
          reste: resteAPayer(prix, verse),
          // Part deja encaissee : distingue le client qui n'a rien verse
          // de celui a qui il ne manque qu'un solde symbolique.
          part: partVersee(prix, verse),
        };
      })
      .filter((commande) => commande.reste > 0)
      .sort((a, b) => b.reste - a.reste);

    const ecart =
      encaissePrecedent > 0
        ? ((encaisseMois - encaissePrecedent) / encaissePrecedent) * 100
        : null;

    return {
      debutMois,
      encaisseMois,
      repartition,
      acomptesMois,
      commandesMois,
      valeurCommandesMois,
      impayes,
      ecart,
      moisPrecedent: debutPrecedent.toLocaleDateString("fr-FR", { month: "long" }),
      totalCreances: impayes.reduce((somme, commande) => somme + commande.reste, 0),
      // Rien versé du tout : le cas qui demande une relance, pas un rappel.
      jamaisVerse: impayes.filter((commande) => commande.part === 0).length,
    };
  }, [clients, commandes, paiements]);

  if (!chargee) return <SqueletteBilan />;

  return (
    <>
      <Panneau classe="mt-4 p-5">
        <p className="text-[11px] font-medium tracking-[0.12em] text-vert-pale uppercase">
          Encaissé en{" "}
          {bilan.debutMois.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })}
        </p>

        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-[2.125rem] leading-none font-semibold tracking-tight sm:text-5xl">
            {nombre.format(bilan.encaisseMois)}
          </span>
          <span className="text-sm font-medium text-vert-pale">FCFA</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          {bilan.ecart !== null && (
            <span
              className={`flex items-center gap-1.5 ${
                bilan.ecart >= 0 ? "text-vert-pale" : "text-ambre-clair"
              }`}
            >
              {bilan.ecart >= 0 ? (
                <TrendUp size={15} weight="bold" aria-hidden />
              ) : (
                <TrendDown size={15} weight="bold" aria-hidden />
              )}
              {bilan.ecart >= 0 ? "+" : "−"}
              {Math.abs(Math.round(bilan.ecart))} % sur {bilan.moisPrecedent}
            </span>
          )}
          <span className="text-vert-pale">
            dont {formaterMontant(bilan.acomptesMois)} d&apos;acomptes
          </span>
        </div>
      </Panneau>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Vignette
          libelle="Commandes du mois"
          valeur={nombre.format(bilan.valeurCommandesMois)}
          unite="FCFA"
          precision={`${bilan.commandesMois.length} commande${
            bilan.commandesMois.length > 1 ? "s" : ""
          } prise${bilan.commandesMois.length > 1 ? "s" : ""}`}
        />
        <Vignette
          libelle="Créances"
          valeur={nombre.format(bilan.totalCreances)}
          unite="FCFA"
          precision={
            bilan.impayes.length === 0
              ? "tout est soldé"
              : bilan.jamaisVerse > 0
                ? `${bilan.impayes.length} commandes · ${bilan.jamaisVerse} sans acompte`
                : `${bilan.impayes.length} commande${bilan.impayes.length > 1 ? "s" : ""}`
          }
          alerte={bilan.totalCreances > 0}
        />
      </div>

      {/*
       * Par quel moyen l'argent est arrive.
       *
       * Absente tant qu'aucun versement n'est enregistre : une barre a zero
       * n'apprend rien, et une carte vide donne l'impression d'un ecran
       * casse plutot que d'un mois qui commence.
       */}
      {bilan.repartition.length > 0 && (
        <Carte classe="mt-3 p-5">
          <h2 className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
            Reçu en
          </h2>

          <div
            aria-hidden
            className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full"
          >
            {bilan.repartition.map((part) => (
              <div
                key={part.methode}
                style={{ width: `${part.part}%` }}
                className={TEINTES_METHODE[part.methode]}
              />
            ))}
          </div>

          <ul className="mt-3 flex flex-col gap-1.5">
            {bilan.repartition.map((part) => (
              <li
                key={part.methode}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${TEINTES_METHODE[part.methode]}`}
                  />
                  <span className="truncate text-gris">
                    {METHODE_LABELS[part.methode]}
                  </span>
                </span>
                <span className="chiffres shrink-0 text-encre">
                  {formaterMontant(part.montant)}{" "}
                  <span className="text-gris">
                    ({Math.round(part.part)} %)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Carte>
      )}

      <section className="mt-6">
        <EnTeteSection titre="À recouvrer" />

        {bilan.impayes.length === 0 ? (
          <Carte classe="mt-2 flex items-center gap-3 px-4 py-4">
            <CheckCircle
              size={20}
              weight="fill"
              className="shrink-0 text-vert"
              aria-hidden
            />
            <p className="text-sm text-gris">
              Aucun impayé. Toutes les commandes sont soldées.
            </p>
          </Carte>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {bilan.impayes.map((commande) => (
              <li key={commande.id}>
                <CarteLien href={`/commandes/${commande.id}`} classe="px-4 py-3">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium text-encre">
                      {commande.client}
                    </span>
                    {/*
                     * Les restes dus se lisent les uns sous les autres, du
                     * plus gros au plus petit : chasse fixe pour que les
                     * ordres de grandeur s'alignent a l'oeil.
                     */}
                    <span className="chiffres shrink-0 text-sm font-semibold text-rouge">
                      {formaterMontant(commande.reste)}
                    </span>
                  </span>

                  <span className="mt-1 flex items-baseline justify-between gap-3">
                    <span className="truncate text-xs text-gris">
                      {commande.nom_modele ?? "Sans modèle"} ·{" "}
                      {mots.statuts[commande.statut as Statut]}
                    </span>
                    <span className="chiffres shrink-0 text-xs text-gris">
                      {commande.part === 0
                        ? "rien versé"
                        : `${Math.round(commande.part)} % versé`}
                    </span>
                  </span>

                  {/*
                   * Une jauge par ligne : la somme due ne dit pas ou en est
                   * le client. Cinquante mille restants sur une commande
                   * deja payee aux trois quarts ne s'appelle pas de la meme
                   * facon qu'une commande jamais entamee.
                   */}
                  <span className="mt-2 block h-1 overflow-hidden rounded-full bg-vert-clair">
                    <span
                      style={{ width: `${commande.part}%` }}
                      className="block h-full rounded-full bg-vert"
                    />
                  </span>
                </CarteLien>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function SqueletteBilan() {
  return (
    <div role="status" aria-label="Chargement du bilan">
      <Squelette rayon="panneau" classe="mt-4 h-36" />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Squelette rayon="carte" classe="h-24" />
        <Squelette rayon="carte" classe="h-24" />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-28" />
        <SqueletteLigne />
        <SqueletteLigne />
      </div>
    </div>
  );
}
