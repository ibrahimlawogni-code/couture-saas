"use client";

import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { plafonds } from "@/lib/formules";
import { useDonnees } from "@/lib/offline/use-donnees";
import { LienBouton } from "@/ui/bouton";
import { Message } from "@/ui/message";

export type Ressource = "clients" | "commandes";

const LIBELLES: Record<Ressource, { singulier: string; pluriel: string }> = {
  clients: { singulier: "client", pluriel: "clients" },
  commandes: { singulier: "commande en cours", pluriel: "commandes en cours" },
};

/**
 * Ce qu'il reste avant la limite de la formule.
 *
 * Les commandes livrees ne comptent pas : la page de tarifs promet cinq
 * commandes "en cours", pas cinq au total. Un atelier gratuit peut donc
 * travailler indefiniment tant qu'il livre ce qu'il commence.
 */
export function useQuota(ressource: Ressource) {
  const { atelier, clients, commandes, chargee } = useDonnees();
  const limites = plafonds(atelier?.formule);

  const plafond =
    ressource === "clients" ? limites.clients : limites.commandesEnCours;

  const utilises =
    ressource === "clients"
      ? clients.length
      : commandes.filter((commande) => commande.statut !== "livre").length;

  return {
    chargee,
    formule: limites.nom,
    illimite: plafond === null,
    plafond,
    utilises,
    restants: plafond === null ? null : Math.max(0, plafond - utilises),
    atteint: plafond !== null && utilises >= plafond,
  };
}

/** Bouton d'ajout qui refuse d'ouvrir un formulaire voue au refus. */
export function BoutonAjout({
  ressource,
  href,
  children,
}: {
  ressource: Ressource;
  href: string;
  children: React.ReactNode;
}) {
  const quota = useQuota(ressource);

  if (quota.atteint) {
    return (
      <LienBouton href="/#tarifs" allure="attention">
        Limite atteinte
      </LienBouton>
    );
  }

  return (
    <LienBouton href={href}>
      <Plus size={15} weight="bold" />
      {children}
    </LienBouton>
  );
}

/**
 * Annonce la limite, mais seulement quand elle approche. Rappeler son
 * plafond a quelqu'un qui a cree deux clients n'apporte rien, et fait
 * passer pour une contrainte ce qui est encore une marge confortable.
 */
export function BandeauQuota({ ressource }: { ressource: Ressource }) {
  const quota = useQuota(ressource);
  const libelle = LIBELLES[ressource];

  if (!quota.chargee || quota.illimite) return null;
  if (quota.restants !== null && quota.restants > 2) return null;

  if (quota.atteint) {
    return (
      <Message
        ton="attention"
        classe="mt-4"
        titre={`Vous avez atteint ${quota.plafond} ${libelle.pluriel}.`}
      >
        <p>
          {ressource === "commandes"
            ? "Marquez une commande comme livrée pour en démarrer une autre, ou "
            : "Pour continuer, "}
          <Link href="/#tarifs">passez à l&apos;offre Atelier</Link>.
        </p>
      </Message>
    );
  }

  return (
    <p className="mt-4 text-sm text-gris">
      Offre {quota.formule} : il vous reste {quota.restants}{" "}
      {quota.restants === 1 ? libelle.singulier : libelle.pluriel}.{" "}
      <Link
        href="/#tarifs"
        className="font-medium text-vert underline underline-offset-2"
      >
        Voir les offres
      </Link>
    </p>
  );
}
