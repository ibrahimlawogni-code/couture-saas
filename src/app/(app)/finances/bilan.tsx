"use client";

import { useMemo } from "react";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { STATUT_LABELS, formaterMontant, type Statut } from "@/lib/commandes";
import { useDonnees } from "@/lib/offline/use-donnees";
import { Carte, CarteLien, Panneau } from "@/ui/carte";
import { EnTeteSection } from "@/ui/page";
import { Squelette, SqueletteLigne, SqueletteVignette } from "@/ui/squelette";

function debutDuMois() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function BilanFinancier() {
  const { clients, commandes, paiements, chargee } = useDonnees();

  const bilan = useMemo(() => {
    const debutMois = debutDuMois();
    const estDeCeMois = (date: string) => new Date(date) >= debutMois;

    const encaisseMois = paiements
      .filter((paiement) => estDeCeMois(paiement.created_at))
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
      .map((commande) => ({
        ...commande,
        client: nomsClients.get(commande.client_id) ?? "Client inconnu",
        reste:
          Number(commande.prix_total) - (verseParCommande.get(commande.id) ?? 0),
      }))
      .filter((commande) => commande.reste > 0)
      .sort((a, b) => b.reste - a.reste);

    return {
      debutMois,
      encaisseMois,
      acomptesMois,
      commandesMois,
      valeurCommandesMois,
      impayes,
      totalCreances: impayes.reduce((somme, commande) => somme + commande.reste, 0),
    };
  }, [clients, commandes, paiements]);

  if (!chargee) return <SqueletteBilan />;

  return (
    <>
      <p className="mt-1 text-sm text-gris">
        Mois de{" "}
        {bilan.debutMois.toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        })}
      </p>

      {/*
       * Le chiffre d'accroche de l'ecran, et le seul : tout le reste est
       * en retrait.
       *
       * Il est plus petit que ce qu'une regle generale recommanderait pour
       * un chiffre d'accroche. Cette regle suppose une valeur compacte,
       * du genre « 12,9K » ; ici le montant est ecrit en entier et suivi
       * de sa devise - « 1 250 000 FCFA » fait quinze caracteres, qui ne
       * tiennent pas sur la largeur d'un telephone a cette taille. Il
       * grandit donc des que l'ecran le permet.
       *
       * Chiffres proportionnels et non tabulaires : la chasse fixe donne a
       * chaque chiffre la largeur d'un zero et distend visiblement une
       * valeur isolee de cette taille.
       */}
      <Panneau classe="mt-4 p-5">
        <p className="text-xs tracking-wide text-vert-pale uppercase">
          Encaissé ce mois
        </p>
        <p className="mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl">
          {formaterMontant(bilan.encaisseMois)}
        </p>
        <p className="mt-1.5 text-sm text-vert-pale">
          dont {formaterMontant(bilan.acomptesMois)} d&apos;acomptes
        </p>
      </Panneau>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Carte classe="p-4">
          <p className="text-xs text-gris">Commandes du mois</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-encre">
            {formaterMontant(bilan.valeurCommandesMois)}
          </p>
          <p className="mt-0.5 text-xs text-gris">
            {bilan.commandesMois.length} commande
            {bilan.commandesMois.length > 1 ? "s" : ""}
          </p>
        </Carte>

        <Carte classe="p-4">
          <p className="text-xs text-gris">Créances en attente</p>
          <p
            className={`mt-1 text-lg font-semibold tracking-tight ${
              bilan.totalCreances > 0 ? "text-rouge" : "text-vert"
            }`}
          >
            {formaterMontant(bilan.totalCreances)}
          </p>
          <p className="mt-0.5 text-xs text-gris">
            {bilan.impayes.length} commande{bilan.impayes.length > 1 ? "s" : ""}
          </p>
        </Carte>
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
                <CarteLien
                  href={`/commandes/${commande.id}`}
                  classe="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-encre">
                      {commande.client}
                    </span>
                    <span className="block truncate text-xs text-gris">
                      {commande.nom_modele ?? "Sans modèle"} ·{" "}
                      {STATUT_LABELS[commande.statut as Statut]}
                    </span>
                  </span>
                  {/*
                   * Les restes dus se lisent les uns sous les autres, du
                   * plus gros au plus petit : chasse fixe pour que les
                   * ordres de grandeur s'alignent a l'oeil.
                   */}
                  <span className="chiffres shrink-0 text-sm font-semibold text-rouge">
                    {formaterMontant(commande.reste)}
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
      <Squelette classe="mt-2 h-3.5 w-32" />
      <Squelette classe="mt-4 h-32 rounded-panneau" />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SqueletteVignette />
        <SqueletteVignette />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-28" />
        <SqueletteLigne />
        <SqueletteLigne />
      </div>
    </div>
  );
}
