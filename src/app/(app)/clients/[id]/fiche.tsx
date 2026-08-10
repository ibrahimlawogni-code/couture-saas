"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useIdentifiantUrl } from "@/lib/identifiant-url";
import { STATUT_LABELS, formaterMontant, type Statut } from "@/lib/commandes";
import { useDonnees } from "@/lib/offline/use-donnees";

const CHAMPS_LABELS: Record<string, string> = {
  poitrine: "Poitrine",
  taille: "Taille",
  hanches: "Hanches",
  longueur_bras: "Longueur bras",
  longueur_jambe: "Longueur jambe",
  col: "Col",
  epaule: "Épaule",
};

export function FicheClient() {
  // Lu dans l'adresse du navigateur : hors ligne, la page vient d'un cache
  // partage entre toutes les fiches, et les donnees de navigation de Next
  // designeraient un autre client.
  const clientId = useIdentifiantUrl();

  const { clients, mesures, commandes, chargee } = useDonnees();

  const client = clients.find((candidat) => candidat.id === clientId);

  const mesuresClient = useMemo(
    () =>
      mesures
        .filter((mesure) => mesure.client_id === clientId)
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
        ),
    [mesures, clientId]
  );

  const commandesClient = useMemo(
    () =>
      commandes
        .filter((commande) => commande.client_id === clientId)
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
        ),
    [commandes, clientId]
  );

  if (!chargee) {
    return <p className="mt-8 text-sm text-gris">Chargement...</p>;
  }

  if (!client) {
    return (
      <p className="mt-8 text-sm text-gris">
        Ce client est introuvable dans les données enregistrées sur cet appareil.
      </p>
    );
  }

  const derniere = mesuresClient[0];
  const historique = mesuresClient.slice(1);

  return (
    <>
      <div className="mt-2">
        <h1 className="text-xl font-semibold text-encre">{client.nom}</h1>
        <p className="text-sm text-gris">
          {client.telephone ?? "Pas de téléphone"}
          {client.whatsapp ? ` · WhatsApp ${client.whatsapp}` : ""}
        </p>
        {client.notes && <p className="mt-1 text-sm text-gris">{client.notes}</p>}
      </div>

      <div className="mt-4 flex gap-3">
        <Link
          href={`/clients/${client.id}/mesures/new`}
          className="flex-1 rounded-2xl border border-bordure bg-white px-4 py-3 text-center text-sm font-medium text-encre active:bg-papier"
        >
          + Mesure
        </Link>
        <Link
          href={`/commandes/new?client=${client.id}`}
          className="flex-1 rounded-2xl bg-foret px-4 py-3 text-center text-sm font-medium text-white active:bg-vert"
        >
          + Commande
        </Link>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gris">
          Dernières mesures
        </h2>
        {derniere ? (
          <div className="mt-2 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gris">
              {new Date(derniere.created_at).toLocaleDateString("fr-FR")} ·{" "}
              {derniere.libelle}
              {derniere.enAttente && " · en attente d'envoi"}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(derniere.valeurs ?? {}).map(([cle, valeur]) => (
                <div
                  key={cle}
                  className="flex justify-between border-b border-bordure py-1 text-sm"
                >
                  <dt className="text-gris">{CHAMPS_LABELS[cle] ?? cle}</dt>
                  <dd className="font-medium text-encre">{String(valeur)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gris">Aucune mesure enregistrée.</p>
        )}
      </section>

      {historique.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gris">
            Historique
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {historique.map((mesure) => (
              <li
                key={mesure.id}
                className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm"
              >
                {new Date(mesure.created_at).toLocaleDateString("fr-FR")} ·{" "}
                {mesure.libelle}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gris">
          Commandes
        </h2>
        {commandesClient.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {commandesClient.map((commande) => (
              <li key={commande.id}>
                <Link
                  href={`/commandes/${commande.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm active:bg-papier"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-encre">
                      {commande.nom_modele ?? "Sans modèle"}
                    </p>
                    <p className="truncate text-xs text-gris">
                      {commande.enAttente
                        ? "En attente d'envoi"
                        : STATUT_LABELS[commande.statut as Statut]}
                      {commande.date_livraison
                        ? ` · ${new Date(commande.date_livraison).toLocaleDateString("fr-FR")}`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-gris">
                    {formaterMontant(Number(commande.prix_total))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gris">Aucune commande.</p>
        )}
      </section>
    </>
  );
}
