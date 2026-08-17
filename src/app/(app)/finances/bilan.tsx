"use client";

import { useMemo } from "react";
import { CheckCircle, TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";
import { STATUT_LABELS, formaterMontant, type Statut } from "@/lib/commandes";
import { useDonnees } from "@/lib/offline/use-donnees";
import { Carte, CarteLien, Panneau } from "@/ui/carte";
import { EnTeteSection } from "@/ui/page";
import { Squelette, SqueletteLigne } from "@/ui/squelette";

const nombre = new Intl.NumberFormat("fr-FR");

function debutDuMois(recul = 0) {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() - recul, 1);
}

export function BilanFinancier() {
  const { clients, commandes, paiements, chargee } = useDonnees();

  const bilan = useMemo(() => {
    const debutMois = debutDuMois();
    const debutPrecedent = debutDuMois(1);
    const estDeCeMois = (date: string) => new Date(date) >= debutMois;

    const encaisseMois = paiements
      .filter((paiement) => estDeCeMois(paiement.created_at))
      .reduce((somme, paiement) => somme + Number(paiement.montant), 0);

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
    const verseParCommande = new Map<string, number>();
    for (const paiement of paiements) {
      verseParCommande.set(
        paiement.commande_id,
        (verseParCommande.get(paiement.commande_id) ?? 0) + Number(paiement.montant)
      );
    }

    const nomsClients = new Map(clients.map((client) => [client.id, client.nom]));

    const impayes = commandes
      .map((commande) => {
        const prix = Number(commande.prix_total);
        const verse = verseParCommande.get(commande.id) ?? 0;
        return {
          ...commande,
          client: nomsClients.get(commande.client_id) ?? "Client inconnu",
          reste: prix - verse,
          // Part deja encaissee : distingue le client qui n'a rien verse
          // de celui a qui il ne manque qu'un solde symbolique.
          part: prix > 0 ? Math.min(100, (verse / prix) * 100) : 0,
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
                      {STATUT_LABELS[commande.statut as Statut]}
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

function Vignette({
  libelle,
  valeur,
  unite,
  precision,
  alerte = false,
}: {
  libelle: string;
  valeur: string;
  unite?: string;
  precision: string;
  alerte?: boolean;
}) {
  return (
    <Carte classe="p-3.5">
      <p className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
        {libelle}
      </p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span
          className={`text-xl leading-none font-semibold tracking-tight sm:text-2xl ${
            alerte ? "text-rouge" : "text-encre"
          }`}
        >
          {valeur}
        </span>
        {unite && <span className="text-[10px] font-medium text-gris">{unite}</span>}
      </p>
      <p className="mt-1.5 text-[11px] leading-tight text-gris">{precision}</p>
    </Carte>
  );
}

function SqueletteBilan() {
  return (
    <div role="status" aria-label="Chargement du bilan">
      <Squelette classe="mt-4 h-36 rounded-panneau" />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Squelette classe="h-24 rounded-carte" />
        <Squelette classe="h-24 rounded-carte" />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-28" />
        <SqueletteLigne />
        <SqueletteLigne />
      </div>
    </div>
  );
}
