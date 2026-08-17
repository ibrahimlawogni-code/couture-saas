"use client";

import { useMemo } from "react";
import {
  ClipboardText,
  Phone,
  Plus,
  Ruler,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { useIdentifiantUrl } from "@/lib/identifiant-url";
import { STATUT_LABELS, formaterMontant, type Statut } from "@/lib/commandes";
import { useDonnees } from "@/lib/offline/use-donnees";
import { normaliserNumero } from "@/lib/whatsapp";
import { LienBouton } from "@/ui/bouton";
import { Carte, CarteLien } from "@/ui/carte";
import { Etiquette } from "@/ui/etiquette";
import { EnTeteSection } from "@/ui/page";
import { Squelette, SqueletteLigne } from "@/ui/squelette";

const nombre = new Intl.NumberFormat("fr-FR");

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

  const { clients, mesures, commandes, paiements, chargee } = useDonnees();

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

  /*
   * Ce que ce client doit, et ce qu'il a en atelier.
   *
   * La liste des clients affichait deja ces deux chiffres par ligne,
   * quand la fiche du meme client, elle, les taisait : il fallait
   * compter les commandes a la main et additionner les restes soi-meme.
   * La liste en disait plus que la page dediee.
   */
  const suivi = useMemo(() => {
    const verse = new Map<string, number>();
    for (const paiement of paiements) {
      verse.set(
        paiement.commande_id,
        (verse.get(paiement.commande_id) ?? 0) + Number(paiement.montant)
      );
    }

    const restes = new Map<string, number>();
    let du = 0;
    let enCours = 0;

    for (const commande of commandesClient) {
      const reste =
        Number(commande.prix_total) - (verse.get(commande.id) ?? 0);
      restes.set(commande.id, reste);

      if (reste > 0) du += reste;
      if (commande.statut !== "livre") enCours += 1;
    }

    return { restes, du, enCours };
  }, [commandesClient, paiements]);

  if (!chargee) return <SqueletteFiche />;

  if (!client) {
    return (
      <Carte classe="mt-6 p-5">
        <p className="text-sm font-medium text-encre">Client introuvable</p>
        <p className="mt-1 text-sm text-gris">
          Cette fiche n&apos;est pas dans les données enregistrées sur cet
          appareil. Si elle a été créée ailleurs, elle apparaîtra au prochain
          passage en ligne.
        </p>
      </Carte>
    );
  }

  const derniere = mesuresClient[0];
  const historique = mesuresClient.slice(1);
  const whatsapp = normaliserNumero(client.whatsapp ?? client.telephone);

  return (
    <>
      <div className="mt-2">
        <h1 className="text-2xl font-semibold tracking-tight text-encre">
          {client.nom}
        </h1>

        {/*
         * Le numero etait affiche en texte mort. Un atelier appelle ses
         * clients depuis cette fiche : les deux moyens de contact sont
         * maintenant des liens, et l'appareil ouvre le composeur ou
         * WhatsApp directement.
         */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {client.telephone ? (
            <a
              href={`tel:${client.telephone.replace(/\s/g, "")}`}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-bordure bg-white px-3 text-sm text-encre transition-colors duration-150 ease-doux hover:border-vert-clair hover:bg-papier"
            >
              <Phone size={15} className="text-gris" />
              <span className="chiffres">{client.telephone}</span>
            </a>
          ) : (
            <span className="text-sm text-gris">Pas de téléphone</span>
          )}

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-bordure bg-white px-3 text-sm text-encre transition-colors duration-150 ease-doux hover:border-vert-clair hover:bg-papier"
            >
              <WhatsappLogo size={15} className="text-vert" />
              WhatsApp
            </a>
          )}
        </div>

        {client.notes && (
          <p className="mt-3 rounded-carte bg-white/60 px-3 py-2 text-sm text-gris">
            {client.notes}
          </p>
        )}
      </div>

      {/*
       * Le bandeau de synthese, dans la meme grammaire que les autres
       * ecrans : libelle en petites capitales, valeur en grand, unite en
       * retrait. Il repond aux deux questions qu'on se pose en ouvrant une
       * fiche - combien me doit-il, et qu'est-ce que j'ai de lui en
       * atelier.
       */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Vignette
          libelle="Doit"
          valeur={suivi.du > 0 ? nombre.format(suivi.du) : "0"}
          unite="FCFA"
          alerte={suivi.du > 0}
        />
        <Vignette libelle="En cours" valeur={String(suivi.enCours)} />
        <Vignette
          libelle="Client depuis"
          valeur={new Date(client.created_at).toLocaleDateString("fr-FR", {
            month: "short",
            year: "2-digit",
          })}
          petit
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <LienBouton
          href={`/clients/${client.id}/mesures/new`}
          allure="secondaire"
          pleineLargeur
        >
          <Ruler size={15} />
          Mesure
        </LienBouton>
        <LienBouton href={`/commandes/new?client=${client.id}`} pleineLargeur>
          <Plus size={15} weight="bold" />
          Commande
        </LienBouton>
      </div>

      <section className="mt-6">
        <EnTeteSection titre="Dernières mesures" />

        {derniere ? (
          <Carte classe="mt-2 p-4">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gris">
              <span>{new Date(derniere.created_at).toLocaleDateString("fr-FR")}</span>
              <span aria-hidden>·</span>
              <span className="font-medium text-encre">{derniere.libelle}</span>
              {derniere.enAttente && (
                <Etiquette ton="systeme">En attente d&apos;envoi</Etiquette>
              )}
            </p>

            {/*
             * Les valeurs se lisent en colonne, d'une ligne a l'autre :
             * chasse fixe pour qu'un 8 et un 11 s'alignent au chiffre pres.
             */}
            <dl className="mt-3 grid grid-cols-2 gap-x-5">
              {Object.entries(derniere.valeurs ?? {}).map(([cle, valeur]) => (
                <div
                  key={cle}
                  /*
                   * Filet sous chaque ligne, sans exception pour la
                   * derniere : dans une grille a deux colonnes, « dernier
                   * enfant » ne designe que le bas d'une seule des deux,
                   * et le filet disparaissait d'un cote seulement des que
                   * le nombre de mesures etait impair.
                   */
                  className="flex items-baseline justify-between gap-2 border-b border-bordure py-2"
                >
                  <dt className="truncate text-xs text-gris">
                    {CHAMPS_LABELS[cle] ?? cle}
                  </dt>
                  {/*
                   * La mesure pesait autant que son libelle. C'est
                   * pourtant le chiffre qu'on vient chercher : le libelle
                   * ne sert qu'a savoir de quoi il parle.
                   */}
                  <dd className="chiffres shrink-0 text-base font-semibold text-encre">
                    {String(valeur)}
                  </dd>
                </div>
              ))}
            </dl>
          </Carte>
        ) : (
          <Carte classe="mt-2 px-4 py-4">
            <p className="text-sm text-gris">
              Aucune mesure enregistrée. Prenez-les une fois, elles serviront à
              toutes les commandes suivantes.
            </p>
          </Carte>
        )}
      </section>

      {historique.length > 0 && (
        <section className="mt-6">
          <EnTeteSection titre="Historique des mesures" />
          <ul className="mt-2 flex flex-col gap-2">
            {historique.map((mesure) => (
              <li key={mesure.id}>
                <Carte classe="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="truncate text-sm text-encre">
                    {mesure.libelle}
                  </span>
                  <span className="chiffres shrink-0 text-xs text-gris">
                    {new Date(mesure.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </Carte>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <EnTeteSection titre="Commandes" />

        {commandesClient.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {commandesClient.map((commande) => (
              <li key={commande.id}>
                <CarteLien
                  href={`/commandes/${commande.id}`}
                  provisoire={commande.enAttente || commande.enEchec}
                  classe="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-encre">
                      {commande.nom_modele ?? "Sans modèle"}
                    </span>
                    <span className="block truncate text-xs text-gris">
                      {commande.enAttente
                        ? "En attente d'envoi"
                        : STATUT_LABELS[commande.statut as Statut]}
                      {commande.date_livraison
                        ? ` · ${new Date(commande.date_livraison).toLocaleDateString("fr-FR")}`
                        : ""}
                    </span>
                  </span>
                  {/*
                   * Le reste du plutot que le prix, comme sur le Kanban et
                   * la liste des clients. Le prix seul ne dit pas s'il y a
                   * de l'argent a reclamer avec le vetement.
                   */}
                  {(() => {
                    const reste = suivi.restes.get(commande.id) ?? 0;
                    return (
                      <span
                        className={`chiffres shrink-0 text-sm font-medium ${
                          reste > 0 ? "text-rouge" : "text-vert"
                        }`}
                      >
                        {reste > 0 ? formaterMontant(reste) : "soldé"}
                      </span>
                    );
                  })()}
                </CarteLien>
              </li>
            ))}
          </ul>
        ) : (
          <Carte classe="mt-2 flex items-center gap-3 px-4 py-4">
            <ClipboardText
              size={19}
              className="shrink-0 text-gris"
              aria-hidden
            />
            <p className="text-sm text-gris">Aucune commande pour ce client.</p>
          </Carte>
        )}
      </section>
    </>
  );
}

/** Vignette de synthese, alignee sur celles du tableau de bord. */
function Vignette({
  libelle,
  valeur,
  unite,
  alerte = false,
  petit = false,
}: {
  libelle: string;
  valeur: string;
  unite?: string;
  alerte?: boolean;
  /** Une date ne supporte pas la taille d'un montant sur trois colonnes. */
  petit?: boolean;
}) {
  return (
    <Carte classe="p-3">
      <p className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
        {libelle}
      </p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span
          className={`leading-none font-semibold tracking-tight ${
            petit ? "text-base" : "text-lg sm:text-xl"
          } ${alerte ? "text-rouge" : "text-encre"}`}
        >
          {valeur}
        </span>
        {unite && (
          <span className="text-[10px] font-medium text-gris">{unite}</span>
        )}
      </p>
    </Carte>
  );
}

function SqueletteFiche() {
  return (
    <div role="status" aria-label="Chargement de la fiche">
      <Squelette classe="mt-2 h-7 w-2/5" />
      <Squelette classe="mt-3 h-9 w-40 rounded-full" />

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Squelette classe="h-11" />
        <Squelette classe="h-11" />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-32" />
        <Squelette classe="h-32 rounded-carte" />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-24" />
        <SqueletteLigne />
      </div>
    </div>
  );
}
