"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CaretRight,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { useIdentifiantUrl } from "@/lib/identifiant-url";
import { createClient } from "@/lib/supabase/client";
import {
  PRIORITE_LABELS,
  STATUT_LABELS,
  TON_PRIORITE,
  formaterMontant,
  priorite,
  statutSuivant,
  type Statut,
} from "@/lib/commandes";
import {
  lienWhatsApp,
  messagePret,
  messageRappelEssayage,
  messageRecapitulatif,
} from "@/lib/whatsapp";
import { enregistrer } from "@/lib/offline/enregistrer";
import { rafraichirMiroir } from "@/lib/offline/miroir";
import { useDonnees } from "@/lib/offline/use-donnees";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { Bouton } from "@/ui/bouton";
import { Carte } from "@/ui/carte";
import { Etiquette } from "@/ui/etiquette";
import { Squelette } from "@/ui/squelette";
import { BoutonRecu } from "./recu";

const BUCKET = "commandes";
const HEURE_EN_SECONDES = 3600;

const nombre = new Intl.NumberFormat("fr-FR");

export function DetailCommande() {
  // Lu dans l'adresse du navigateur : hors ligne, la page vient d'un cache
  // partage entre toutes les commandes, et les donnees de navigation de Next
  // designeraient une autre commande.
  const commandeId = useIdentifiantUrl() ?? "";

  const { atelier, clients, commandes, paiements, chargee } = useDonnees();
  const nomAtelier = atelier?.nom ?? "Mon atelier";
  const { horsLigne } = useFileAttente();
  const [signatures, setSignatures] = useState<string[]>([]);
  const [montant, setMontant] = useState("");

  const commande = commandes.find((candidat) => candidat.id === commandeId);
  const client = clients.find((candidat) => candidat.id === commande?.client_id);

  const versements = useMemo(
    () =>
      paiements
        .filter((paiement) => paiement.commande_id === commandeId)
        .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")),
    [paiements, commandeId]
  );

  const totalPaye = versements.reduce(
    (somme, paiement) => somme + Number(paiement.montant),
    0
  );
  const resteAPayer = Number(commande?.prix_total ?? 0) - totalPaye;

  // Le bucket est prive : les photos exigent une URL signee, donc du reseau.
  const cheminsPhotos = useMemo(
    () =>
      [commande?.photo_modele_url, commande?.photo_tissu_url].filter(
        (chemin): chemin is string => Boolean(chemin)
      ),
    [commande?.photo_modele_url, commande?.photo_tissu_url]
  );

  useEffect(() => {
    if (cheminsPhotos.length === 0 || horsLigne) return;

    let actif = true;
    const supabase = createClient();

    supabase.storage
      .from(BUCKET)
      .createSignedUrls(cheminsPhotos, HEURE_EN_SECONDES)
      .then(({ data }) => {
        if (!actif) return;
        setSignatures(
          (data ?? []).flatMap((photo) => (photo.signedUrl ? [photo.signedUrl] : []))
        );
      });

    return () => {
      actif = false;
    };
  }, [cheminsPhotos, horsLigne]);

  // Sans reseau, les URLs signees ne peuvent pas etre obtenues ni renouvelees.
  const photos = horsLigne || cheminsPhotos.length === 0 ? [] : signatures;

  if (!chargee) return <SqueletteDetail />;

  if (!commande) {
    return (
      <Carte classe="mt-6 p-5">
        <p className="text-sm font-medium text-encre">Commande introuvable</p>
        <p className="mt-1 text-sm text-gris">
          Cette commande n&apos;est pas dans les données enregistrées sur cet
          appareil. Si elle a été créée ailleurs, elle apparaîtra au prochain
          passage en ligne.
        </p>
      </Carte>
    );
  }

  const statut = commande.statut as Statut;
  const suivant = statutSuivant(statut);
  const niveau = priorite(commande.date_livraison, statut);
  const prixTotal = Number(commande.prix_total);
  // Une commande a prix nul ne doit pas afficher une jauge remplie a 0 % :
  // il n'y a rien a encaisser, donc rien a suivre.
  const partPayee = prixTotal > 0 ? Math.min(100, (totalPaye / prixTotal) * 100) : 0;

  async function avancer() {
    if (!suivant) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("commandes")
      .update({ statut: suivant })
      .eq("id", commandeId);
    if (!error) await rafraichirMiroir();
  }

  async function ajouterPaiement(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const valeur = Number(montant);
    if (valeur <= 0) return;

    await enregistrer("paiements", {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      commande_id: commandeId,
      montant: valeur,
      type: "complement",
    });

    setMontant("");
  }

  const numero = client?.whatsapp ?? client?.telephone ?? null;
  const nomClient = client?.nom ?? "";
  const donneesMessage = {
    nom_modele: commande.nom_modele,
    statut,
    prix_total: prixTotal,
    date_essayage: commande.date_essayage,
    date_livraison: commande.date_livraison,
  };

  const messagesWhatsApp = [
    {
      cle: "recapitulatif",
      label: "Envoyer le récapitulatif",
      texte: messageRecapitulatif(nomAtelier, nomClient, donneesMessage, resteAPayer),
      visible: true,
    },
    {
      cle: "essayage",
      label: "Rappeler l'essayage",
      texte: messageRappelEssayage(nomAtelier, nomClient, donneesMessage),
      visible: Boolean(commande.date_essayage) && statut !== "livre",
    },
    {
      cle: "pret",
      label: "Prévenir que c'est prêt",
      texte: messagePret(nomAtelier, nomClient, donneesMessage, resteAPayer),
      visible: statut === "pret",
    },
  ].filter((message) => message.visible);

  return (
    <>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-encre">
            {commande.nom_modele ?? "Commande"}
          </h1>
          <Link
            href={`/clients/${commande.client_id}`}
            className="mt-1 inline-flex items-center gap-1 text-sm text-gris underline underline-offset-2 hover:text-encre"
          >
            {nomClient || "Client inconnu"}
            <CaretRight size={11} weight="bold" />
          </Link>
        </div>
        <Etiquette ton={TON_PRIORITE[niveau]}>{PRIORITE_LABELS[niveau]}</Etiquette>
      </div>

      <Bloc titre="Statut" classe="mt-5">
        <p className="text-lg font-semibold text-encre">{STATUT_LABELS[statut]}</p>

        {suivant && (
          <Bouton
            type="button"
            onClick={avancer}
            disabled={horsLigne || commande.enAttente}
            pleineLargeur
            classe="mt-3 min-h-12"
          >
            Passer à : {STATUT_LABELS[suivant]}
            <ArrowRight size={15} weight="bold" />
          </Bouton>
        )}

        {horsLigne && (
          <p className="mt-2 text-xs text-gris">
            L&apos;avancement du statut demande une connexion : il modifie une
            commande déjà enregistrée, et la file locale ne sait rejouer que des
            créations.
          </p>
        )}
      </Bloc>

      <Bloc titre="WhatsApp" classe="mt-3">
        {numero ? (
          <div className="flex flex-col gap-2">
            {messagesWhatsApp.map((message) => (
              <a
                key={message.cle}
                href={lienWhatsApp(numero, message.texte) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-controle border border-bordure bg-white px-4 text-sm font-medium text-encre transition-colors duration-150 ease-doux hover:border-vert-clair hover:bg-papier"
              >
                <WhatsappLogo size={17} weight="fill" className="text-vert" />
                {message.label}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gris">
            Aucun numéro enregistré pour ce client.
          </p>
        )}
      </Bloc>

      <Bloc titre="Dates" classe="mt-3">
        <Ligne
          libelle="Essayage"
          valeur={
            commande.date_essayage
              ? new Date(commande.date_essayage).toLocaleDateString("fr-FR")
              : "Non définie"
          }
        />
        <Ligne
          libelle="Livraison"
          valeur={
            commande.date_livraison
              ? new Date(commande.date_livraison).toLocaleDateString("fr-FR")
              : "Non définie"
          }
        />
      </Bloc>

      <Bloc titre={resteAPayer > 0 ? "Reste à payer" : "Paiement"} classe="mt-3">
        {/*
         * Le solde en grand, le detail en dessous. C'est la seule question
         * qui se pose au moment de remettre la piece, et elle se lisait
         * jusqu'ici sur la troisieme ligne d'un bloc, de la meme taille que
         * le prix total et ce qui avait deja ete verse.
         */}
        <p className="flex items-baseline gap-2">
          <span
            className={`text-[1.75rem] leading-none font-semibold tracking-tight ${
              resteAPayer > 0 ? "text-rouge" : "text-vert"
            }`}
          >
            {resteAPayer > 0 ? nombre.format(resteAPayer) : "Soldé"}
          </span>
          {resteAPayer > 0 && (
            <span className="text-xs font-medium text-gris">FCFA</span>
          )}
        </p>

        {/*
         * Jauge d'encaissement. Le remplissage porte ce qui est acquis, la
         * piste porte ce qui reste : deux pas d'une meme rampe verte, pour
         * que l'etat se lise sur toute la largeur et pas seulement au
         * bord du remplissage.
         */}
        {prixTotal > 0 && (
          <div
            role="progressbar"
            aria-label="Part du prix déjà encaissée"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(partPayee)}
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-vert-clair"
          >
            <div
              style={{ width: `${partPayee}%` }}
              className="h-full rounded-full bg-vert transition-[width] duration-300 ease-doux"
            />
          </div>
        )}

        <div className="mt-3 border-t border-bordure pt-2.5">
          <Ligne libelle="Prix total" valeur={formaterMontant(prixTotal)} />
          <Ligne
            libelle={`Déjà versé · ${Math.round(partPayee)} %`}
            valeur={formaterMontant(totalPaye)}
          />
        </div>

        {resteAPayer > 0 && (
          <form onSubmit={ajouterPaiement} className="mt-3 flex gap-2">
            <label htmlFor="montant" className="sr-only">
              Montant reçu
            </label>
            <input
              id="montant"
              value={montant}
              onChange={(evenement) => setMontant(evenement.target.value)}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Montant reçu"
              required
              className="min-h-11 w-full min-w-0 flex-1 rounded-controle border border-bordure px-4 py-3 text-base transition-colors duration-150 ease-doux hover:border-vert-pale"
            />
            <Bouton type="submit" classe="shrink-0">
              Ajouter
            </Bouton>
          </form>
        )}

        {versements.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5 border-t border-bordure pt-3">
            {versements.map((paiement) => (
              <li
                key={paiement.id}
                className="flex items-baseline justify-between gap-3 text-sm text-gris"
              >
                <span className="min-w-0 truncate">
                  <span className="chiffres">
                    {new Date(paiement.created_at).toLocaleDateString("fr-FR")}
                  </span>{" "}
                  · {paiement.type}
                  {paiement.enAttente && " · en attente"}
                </span>
                {/* Colonne de montants : chasse fixe pour qu'ils s'alignent. */}
                <span className="chiffres shrink-0 text-encre">
                  {formaterMontant(Number(paiement.montant))}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 border-t border-bordure pt-3">
          <BoutonRecu
            donnees={{
              atelier: nomAtelier,
              client: nomClient,
              modele: commande.nom_modele,
              prixTotal,
              dateLivraison: commande.date_livraison,
              versements: versements.map((paiement) => ({
                date: paiement.created_at,
                montant: Number(paiement.montant),
                type: paiement.type,
              })),
            }}
          />
        </div>
      </Bloc>

      {photos.length > 0 && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold tracking-wide text-gris uppercase">
            Photos
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {photos.map((url) => (
              // Images signees a duree limitee : next/image n'apporte rien ici.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Photo de la commande"
                className="aspect-square w-full rounded-carte border border-bordure bg-vert-clair object-cover"
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** Carte a intitule : le motif de section repete tout au long de l'ecran. */
function Bloc({
  titre,
  classe,
  children,
}: {
  titre: string;
  classe?: string;
  children: React.ReactNode;
}) {
  return (
    <Carte classe={`p-4 ${classe ?? ""}`}>
      <h2 className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
        {titre}
      </h2>
      <div className="mt-2">{children}</div>
    </Carte>
  );
}

/** Ligne libelle / valeur, alignee sur la ligne de base. */
function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-sm">
      <span className="text-gris">{libelle}</span>
      <span className="chiffres font-medium text-encre">{valeur}</span>
    </div>
  );
}

function SqueletteDetail() {
  return (
    <div role="status" aria-label="Chargement de la commande">
      <Squelette classe="mt-2 h-7 w-3/5" />
      <Squelette classe="mt-2 h-4 w-2/5" />
      <Squelette classe="mt-5 h-32 rounded-carte" />
      <Squelette classe="mt-3 h-28 rounded-carte" />
      <Squelette classe="mt-3 h-44 rounded-carte" />
    </div>
  );
}
