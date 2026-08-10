"use client";

import { useMemo } from "react";
import Link from "next/link";
import { STATUT_LABELS, formaterMontant, type Statut } from "@/lib/commandes";
import { useDonnees } from "@/lib/offline/use-donnees";

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

  if (!chargee) {
    return <p className="mt-8 text-sm text-gris">Chargement...</p>;
  }

  return (
    <>
      <p className="text-sm text-gris">
        Mois de{" "}
        {bilan.debutMois.toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        })}
      </p>

      <section className="mt-4 rounded-3xl bg-foret p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-wide text-vert-pale">
          Encaissé ce mois
        </p>
        <p className="mt-1 text-3xl font-semibold">
          {formaterMontant(bilan.encaisseMois)}
        </p>
        <p className="mt-1 text-sm text-vert-pale">
          dont {formaterMontant(bilan.acomptesMois)} d&apos;acomptes
        </p>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gris">
            Commandes du mois
          </p>
          <p className="mt-1 text-xl font-semibold text-encre">
            {formaterMontant(bilan.valeurCommandesMois)}
          </p>
          <p className="text-sm text-gris">
            {bilan.commandesMois.length} commande
            {bilan.commandesMois.length > 1 ? "s" : ""}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gris">
            Créances en attente
          </p>
          <p
            className={`mt-1 text-xl font-semibold ${
              bilan.totalCreances > 0 ? "text-rouge" : "text-vert"
            }`}
          >
            {formaterMontant(bilan.totalCreances)}
          </p>
          <p className="text-sm text-gris">
            {bilan.impayes.length} commande{bilan.impayes.length > 1 ? "s" : ""}
          </p>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gris">
          À recouvrer
        </h2>
        {bilan.impayes.length === 0 ? (
          <p className="mt-2 text-sm text-gris">Aucun impayé, tout est soldé.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {bilan.impayes.map((commande) => (
              <li key={commande.id}>
                <Link
                  href={`/commandes/${commande.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm active:bg-papier"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-encre">
                      {commande.client}
                    </p>
                    <p className="truncate text-xs text-gris">
                      {commande.nom_modele ?? "Sans modèle"} ·{" "}
                      {STATUT_LABELS[commande.statut as Statut]}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-rouge">
                    {formaterMontant(commande.reste)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
