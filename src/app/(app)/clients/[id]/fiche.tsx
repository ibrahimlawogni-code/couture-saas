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
import {
  formaterMontant,
  resteAPayer,
  versesParCommande,
  type Statut,
} from "@/lib/commandes";
import { formateurNombre, type Traductions } from "@/lib/i18n";
import { useDonnees } from "@/lib/offline/use-donnees";
import { useTraductions } from "@/lib/offline/use-traductions";
import { normaliserNumero } from "@/lib/whatsapp";
import { LienBouton } from "@/ui/bouton";
import { Carte, CarteLien } from "@/ui/carte";
import { Etiquette } from "@/ui/etiquette";
import { EnTeteSection } from "@/ui/page";
import { Squelette, SqueletteLigne } from "@/ui/squelette";
import { Vignette } from "@/ui/vignette";

export function FicheClient() {
  // Lu dans l'adresse du navigateur : hors ligne, la page vient d'un cache
  // partage entre toutes les fiches, et les donnees de navigation de Next
  // designeraient un autre client.
  const clientId = useIdentifiantUrl();

  const { clients, mesures, commandes, paiements, chargee } = useDonnees();
  const mots = useTraductions();
  const nombre = formateurNombre(mots.locale);

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
    const verse = versesParCommande(paiements);

    const restes = new Map<string, number>();
    let du = 0;
    let enCours = 0;

    for (const commande of commandesClient) {
      const reste = resteAPayer(
        commande.prix_total,
        verse.get(commande.id) ?? 0
      );
      restes.set(commande.id, reste);

      if (reste > 0) du += reste;
      if (commande.statut !== "livre") enCours += 1;
    }

    return { restes, du, enCours };
  }, [commandesClient, paiements]);

  if (!chargee) return <SqueletteFiche mots={mots} />;

  if (!client) {
    return (
      <Carte classe="mt-6 p-5">
        <p className="text-sm font-medium text-encre">
          {mots.clientsEcran.introuvable}
        </p>
        <p className="mt-1 text-sm text-gris">
          {mots.clientsEcran.introuvableTexte}
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
            <span className="text-sm text-gris">{mots.clientsEcran.pasDeTelephone}</span>
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
          libelle={mots.clientsEcran.doit}
          valeur={suivi.du > 0 ? nombre.format(suivi.du) : "0"}
          unite="FCFA"
          alerte={suivi.du > 0}
        />
        <Vignette
          libelle={mots.clientsEcran.enCoursVignette}
          valeur={String(suivi.enCours)}
        />
        <Vignette
          libelle={mots.clientsEcran.clientDepuis}
          valeur={new Date(client.created_at).toLocaleDateString(mots.locale, {
            month: "short",
            year: "2-digit",
          })}
          taille="compacte"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <LienBouton
          href={`/clients/${client.id}/mesures/new`}
          allure="secondaire"
          pleineLargeur
        >
          <Ruler size={15} />
          {mots.clientsEcran.boutonMesure}
        </LienBouton>
        <LienBouton href={`/commandes/new?client=${client.id}`} pleineLargeur>
          <Plus size={15} weight="bold" />
          {mots.clientsEcran.boutonCommande}
        </LienBouton>
      </div>

      <section className="mt-6">
        <EnTeteSection titre={mots.clientsEcran.dernieresMesures} />

        {derniere ? (
          <Carte classe="mt-2 p-4">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gris">
              <span>{new Date(derniere.created_at).toLocaleDateString(mots.locale)}</span>
              <span aria-hidden>·</span>
              <span className="font-medium text-encre">{derniere.libelle}</span>
              {derniere.enAttente && (
                <Etiquette ton="systeme">{mots.clientsEcran.enAttenteEnvoi}</Etiquette>
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
                    {mots.mesuresChamps[cle as keyof typeof mots.mesuresChamps] ?? cle}
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
              {mots.clientsEcran.aucuneMesure}
            </p>
          </Carte>
        )}
      </section>

      {historique.length > 0 && (
        <section className="mt-6">
          <EnTeteSection titre={mots.clientsEcran.historiqueMesures} />
          <ul className="mt-2 flex flex-col gap-2">
            {historique.map((mesure) => (
              <li key={mesure.id}>
                <Carte classe="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="truncate text-sm text-encre">
                    {mesure.libelle}
                  </span>
                  <span className="chiffres shrink-0 text-xs text-gris">
                    {new Date(mesure.created_at).toLocaleDateString(mots.locale)}
                  </span>
                </Carte>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <EnTeteSection titre={mots.clientsEcran.commandes} />

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
                      {commande.nom_modele ?? mots.sansModele}
                    </span>
                    <span className="block truncate text-xs text-gris">
                      {commande.enAttente
                        ? mots.clientsEcran.enAttenteEnvoi
                        : mots.statuts[commande.statut as Statut]}
                      {commande.date_livraison
                        ? ` · ${new Date(commande.date_livraison).toLocaleDateString(mots.locale)}`
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
                        {reste > 0 ? formaterMontant(reste, mots.locale) : mots.solde}
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
            <p className="text-sm text-gris">{mots.clientsEcran.aucuneCommande}</p>
          </Carte>
        )}
      </section>
    </>
  );
}

function SqueletteFiche({ mots }: { mots: Traductions }) {
  return (
    <div role="status" aria-label={mots.clientsEcran.chargement}>
      <Squelette classe="mt-2 h-7 w-2/5" />
      <Squelette rayon="rond" classe="mt-3 h-9 w-40" />

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Squelette classe="h-11" />
        <Squelette classe="h-11" />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-32" />
        <Squelette rayon="carte" classe="h-32" />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Squelette classe="h-3.5 w-24" />
        <SqueletteLigne />
      </div>
    </div>
  );
}
