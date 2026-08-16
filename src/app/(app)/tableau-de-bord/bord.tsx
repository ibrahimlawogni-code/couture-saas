"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle, Plus, UserPlus } from "@phosphor-icons/react/dist/ssr";
import {
  STATUT_LABELS,
  formaterMontant,
  priorite,
  type Statut,
} from "@/lib/commandes";
import { useDonnees } from "@/lib/offline/use-donnees";
import { Carte, CarteLien, Panneau } from "@/ui/carte";
import { Compteur, Etiquette, type TonEtiquette } from "@/ui/etiquette";
import { EnTeteSection } from "@/ui/page";
import { Squelette, SqueletteLigne, SqueletteVignette } from "@/ui/squelette";
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
  if (commande.niveau === "en_retard") return { texte: "En retard", ton: "probleme" };
  if (commande.essayageAujourdhui) return { texte: "Essayage", ton: "attention" };
  if (commande.statut === "pret") return { texte: "À retirer", ton: "metier" };
  return null;
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
      .sort((a, b) =>
        (a.date_livraison ?? "9999").localeCompare(b.date_livraison ?? "9999")
      );

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

  if (!chargee) return <SqueletteBord />;

  const heure = new Date().getHours();
  const salutation = heure < 18 ? "Bonjour" : "Bonsoir";

  return (
    <>
      {/*
       * Le panneau d'accueil est reste volontairement court. Dans la
       * version precedente il occupait tout le premier ecran d'un
       * telephone, et repoussait « A traiter » sous la ligne de flottaison
       * - or c'est la seule raison d'ouvrir l'application le matin.
       */}
      <Panneau classe="p-5">
        <p className="text-xl font-semibold tracking-tight">
          {salutation}
          {atelier?.nom ? `, ${atelier.nom}` : ""}
        </p>
        <p className="mt-1 text-sm text-vert-pale">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
      </Panneau>

      <section className="mt-6">
        <EnTeteSection
          titre="À traiter"
          action={
            bilan.aTraiter.length > 0 && (
              <Compteur ton={bilan.aTraiter.some((c) => c.niveau === "en_retard") ? "probleme" : "attention"}>
                {bilan.aTraiter.length}
              </Compteur>
            )
          }
        />

        {bilan.aTraiter.length === 0 ? (
          /*
           * Le vide se dit, il ne se laisse pas deviner. La section
           * disparaissait entierement quand rien n'etait urgent, et
           * l'absence d'une section n'est pas une information : elle
           * ressemble a un ecran incomplet.
           */
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
          <ul className="mt-2 grid gap-2 lg:grid-cols-2">
            {bilan.aTraiter.slice(0, A_TRAITER_MAX).map((commande) => {
              const raison = motif(commande);

              return (
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
                    {raison && <Etiquette ton={raison.ton}>{raison.texte}</Etiquette>}
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

      <section className="mt-6">
        <EnTeteSection titre="Chiffres" />
        <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Vignette libelle="Encaissé ce mois" valeur={formaterMontant(bilan.encaisseMois)} />
          <Vignette
            libelle="Créances"
            valeur={formaterMontant(bilan.creances)}
            alerte={bilan.creances > 0}
          />
          <Vignette libelle="Commandes en cours" valeur={String(bilan.enCours.length)} />
          <Vignette libelle="Clients" valeur={String(clients.length)} />
        </div>
      </section>

      <Carte classe="mt-6 p-5">
        <h2 className="text-sm font-semibold text-encre">Encaissements par mois</h2>
        <p className="mt-0.5 text-xs text-gris">
          Touchez une barre pour voir le montant exact.
        </p>
        <GraphiqueEncaissements points={bilan.points} />
      </Carte>
    </>
  );
}

/**
 * Vignette de statistique : un libelle, une valeur.
 *
 * Les chiffres restent en chasse proportionnelle. La chasse fixe donne a
 * chaque chiffre la largeur d'un zero, ce qui distend visiblement une
 * valeur isolee de cette taille ; elle est reservee aux colonnes de
 * nombres qui doivent s'aligner.
 */
function Vignette({
  libelle,
  valeur,
  alerte = false,
}: {
  libelle: string;
  valeur: string;
  alerte?: boolean;
}) {
  return (
    <Carte classe="p-4">
      <p className="text-xs text-gris">{libelle}</p>
      <p
        className={`mt-1 text-xl font-semibold tracking-tight ${
          alerte ? "text-rouge" : "text-encre"
        }`}
      >
        {valeur}
      </p>
    </Carte>
  );
}

function SqueletteBord() {
  return (
    <div role="status" aria-label="Chargement du tableau de bord">
      <Squelette classe="h-40 rounded-panneau" />

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-24" />
        <SqueletteLigne />
        <SqueletteLigne />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SqueletteVignette />
        <SqueletteVignette />
        <SqueletteVignette />
        <SqueletteVignette />
      </div>

      <Squelette classe="mt-6 h-56 rounded-carte" />
    </div>
  );
}
