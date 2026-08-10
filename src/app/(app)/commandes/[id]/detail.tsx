"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useIdentifiantUrl } from "@/lib/identifiant-url";
import { createClient } from "@/lib/supabase/client";
import {
  PRIORITE_LABELS,
  PRIORITE_STYLES,
  STATUT_LABELS,
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
import { BoutonRecu } from "./recu";

const BUCKET = "commandes";
const HEURE_EN_SECONDES = 3600;

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

  if (!chargee) {
    return <p className="mt-8 text-sm text-zinc-500">Chargement...</p>;
  }

  if (!commande) {
    return (
      <p className="mt-8 text-sm text-zinc-500">
        Cette commande est introuvable dans les données enregistrées sur cet appareil.
      </p>
    );
  }

  const statut = commande.statut as Statut;
  const suivant = statutSuivant(statut);
  const niveau = priorite(commande.date_livraison, statut);

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
    prix_total: Number(commande.prix_total),
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
          <h1 className="truncate text-xl font-semibold text-zinc-900">
            {commande.nom_modele ?? "Commande"}
          </h1>
          <Link
            href={`/clients/${commande.client_id}`}
            className="text-sm text-zinc-500 underline"
          >
            {nomClient || "Client inconnu"}
          </Link>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${PRIORITE_STYLES[niveau]}`}
        >
          {PRIORITE_LABELS[niveau]}
        </span>
      </div>

      <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Statut</p>
        <p className="mt-1 text-lg font-semibold text-zinc-900">
          {STATUT_LABELS[statut]}
        </p>
        {suivant && (
          <button
            type="button"
            onClick={avancer}
            disabled={horsLigne || commande.enAttente}
            className="mt-3 w-full rounded-xl bg-zinc-900 px-4 py-4 text-base font-medium text-white active:bg-zinc-700 disabled:opacity-40"
          >
            Passer à : {STATUT_LABELS[suivant]}
          </button>
        )}
        {horsLigne && (
          <p className="mt-2 text-xs text-zinc-500">
            L&apos;avancement du statut demande une connexion.
          </p>
        )}
      </section>

      <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">WhatsApp</p>
        {numero ? (
          <div className="mt-2 flex flex-col gap-2">
            {messagesWhatsApp.map((message) => (
              <a
                key={message.cle}
                href={lienWhatsApp(numero, message.texte) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white active:bg-emerald-700"
              >
                {message.label}
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            Aucun numéro enregistré pour ce client.
          </p>
        )}
      </section>

      <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Dates</p>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-zinc-500">Essayage</span>
          <span className="font-medium text-zinc-900">
            {commande.date_essayage
              ? new Date(commande.date_essayage).toLocaleDateString("fr-FR")
              : "Non définie"}
          </span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-zinc-500">Livraison</span>
          <span className="font-medium text-zinc-900">
            {commande.date_livraison
              ? new Date(commande.date_livraison).toLocaleDateString("fr-FR")
              : "Non définie"}
          </span>
        </div>
      </section>

      <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Paiement</p>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-zinc-500">Prix total</span>
          <span className="font-medium text-zinc-900">
            {formaterMontant(Number(commande.prix_total))}
          </span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-zinc-500">Déjà versé</span>
          <span className="font-medium text-zinc-900">{formaterMontant(totalPaye)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-zinc-100 pt-2 text-base">
          <span className="font-medium text-zinc-700">Reste à payer</span>
          <span
            className={`font-semibold ${
              resteAPayer > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {formaterMontant(resteAPayer)}
          </span>
        </div>

        {resteAPayer > 0 && (
          <form onSubmit={ajouterPaiement} className="mt-3 flex gap-2">
            <input
              value={montant}
              onChange={(evenement) => setMontant(evenement.target.value)}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Montant reçu"
              required
              className="w-full min-w-0 flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-base"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white active:bg-zinc-700"
            >
              Ajouter
            </button>
          </form>
        )}

        {versements.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1 border-t border-zinc-100 pt-3">
            {versements.map((paiement) => (
              <li
                key={paiement.id}
                className="flex justify-between text-sm text-zinc-500"
              >
                <span>
                  {new Date(paiement.created_at).toLocaleDateString("fr-FR")} ·{" "}
                  {paiement.type}
                  {paiement.enAttente && " · en attente"}
                </span>
                <span>{formaterMontant(Number(paiement.montant))}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 border-t border-zinc-100 pt-3">
          <BoutonRecu
            donnees={{
              atelier: nomAtelier,
              client: nomClient,
              modele: commande.nom_modele,
              prixTotal: Number(commande.prix_total),
              dateLivraison: commande.date_livraison,
              versements: versements.map((paiement) => ({
                date: paiement.created_at,
                montant: Number(paiement.montant),
                type: paiement.type,
              })),
            }}
          />
        </div>
      </section>

      {photos.length > 0 && (
        <section className="mt-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Photos</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {photos.map((url) => (
              // Images signees a duree limitee : next/image n'apporte rien ici.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Photo de la commande"
                className="aspect-square w-full rounded-xl bg-zinc-200 object-cover"
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
