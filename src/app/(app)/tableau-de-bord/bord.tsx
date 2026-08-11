"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  PRIORITE_STYLES,
  STATUT_LABELS,
  formaterMontant,
  priorite,
  type Statut,
} from "@/lib/commandes";
import { useDonnees } from "@/lib/offline/use-donnees";
import { GraphiqueEncaissements, type PointMensuel } from "./graphique";

const MOIS_AFFICHES = 6;

function memeJour(a: string | null, b: Date) {
  if (!a) return false;
  const date = new Date(a);
  return (
    date.getFullYear() === b.getFullYear() &&
    date.getMonth() === b.getMonth() &&
    date.getDate() === b.getDate()
  );
}

export function TableauDeBord() {
  const { atelier, clients, commandes, paiements, chargee } = useDonnees();

  const bilan = useMemo(() => {
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

    const encaisseMois = paiements
      .filter((p) => new Date(p.created_at) >= debutMois)
      .reduce((somme, p) => somme + Number(p.montant), 0);

    const enCours = commandes.filter((c) => c.statut !== "livre");

    const verseParCommande = new Map<string, number>();
    for (const paiement of paiements) {
      verseParCommande.set(
        paiement.commande_id,
        (verseParCommande.get(paiement.commande_id) ?? 0) + Number(paiement.montant)
      );
    }

    const creances = commandes.reduce((somme, commande) => {
      const reste =
        Number(commande.prix_total) - (verseParCommande.get(commande.id) ?? 0);
      return somme + (reste > 0 ? reste : 0);
    }, 0);

    // Ce qui reclame une decision aujourd'hui, dans l'ordre d'urgence.
    const nomsClients = new Map(clients.map((c) => [c.id, c.nom]));
    const aTraiter = enCours
      .map((commande) => ({
        ...commande,
        client: nomsClients.get(commande.client_id) ?? "Client inconnu",
        niveau: priorite(commande.date_livraison, commande.statut as Statut),
        essayageAujourdhui: memeJour(commande.date_essayage, maintenant),
      }))
      .filter(
        (c) => c.niveau === "en_retard" || c.essayageAujourdhui || c.statut === "pret"
      )
      .sort((a, b) => (a.date_livraison ?? "9999").localeCompare(b.date_livraison ?? "9999"));

    // Six derniers mois d'encaissements, mois courant inclus.
    const points: PointMensuel[] = [];
    for (let recul = MOIS_AFFICHES - 1; recul >= 0; recul--) {
      const debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - recul, 1);
      const fin = new Date(maintenant.getFullYear(), maintenant.getMonth() - recul + 1, 1);

      points.push({
        mois: debut.toISOString().slice(0, 7),
        libelle: debut.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
        montant: paiements
          .filter((p) => {
            const date = new Date(p.created_at);
            return date >= debut && date < fin;
          })
          .reduce((somme, p) => somme + Number(p.montant), 0),
      });
    }

    return { encaisseMois, enCours, creances, aTraiter, points };
  }, [clients, commandes, paiements]);

  if (!chargee) {
    return <p className="mt-8 text-sm text-gris">Chargement...</p>;
  }

  const heure = new Date().getHours();
  const salutation = heure < 18 ? "Bonjour" : "Bonsoir";

  return (
    <>
      <section className="rounded-3xl bg-foret p-6 text-white">
        <p className="text-2xl font-semibold tracking-tight">
          {salutation}
          {atelier?.nom ? `, ${atelier.nom}` : ""}
        </p>
        <p className="mt-1.5 text-vert-pale">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/commandes/new"
            className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-medium text-foret active:translate-y-px"
          >
            Nouvelle commande
          </Link>
          <Link
            href="/clients/new"
            className="rounded-2xl border border-white/25 px-5 py-3 text-center text-sm font-medium text-white active:translate-y-px"
          >
            Nouveau client
          </Link>
        </div>
      </section>

      {bilan.aTraiter.length > 0 && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gris">
            À traiter
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {bilan.aTraiter.slice(0, 5).map((commande) => (
              <li key={commande.id}>
                <Link
                  href={`/commandes/${commande.id}`}
                  className="flex items-center justify-between gap-3 rounded-3xl bg-white px-4 py-3.5 shadow-sm active:bg-papier"
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
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      commande.statut === "pret"
                        ? "bg-vert-clair text-foret"
                        : PRIORITE_STYLES[commande.niveau]
                    }`}
                  >
                    {commande.statut === "pret"
                      ? "À retirer"
                      : commande.essayageAujourdhui
                        ? "Essayage"
                        : "En retard"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <article className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gris">Encaissé ce mois</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-encre">
            {formaterMontant(bilan.encaisseMois)}
          </p>
        </article>
        <article className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gris">Créances</p>
          <p
            className={`mt-1 text-xl font-semibold tracking-tight ${
              bilan.creances > 0 ? "text-rouge" : "text-vert"
            }`}
          >
            {formaterMontant(bilan.creances)}
          </p>
        </article>
        <article className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gris">Commandes en cours</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-encre">
            {bilan.enCours.length}
          </p>
        </article>
        <article className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gris">Clients</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-encre">
            {clients.length}
          </p>
        </article>
      </div>

      <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-encre">Encaissements par mois</h2>
        <p className="mt-0.5 text-xs text-gris">
          Touchez une barre pour voir le montant exact.
        </p>
        <GraphiqueEncaissements points={bilan.points} />
      </section>
    </>
  );
}
