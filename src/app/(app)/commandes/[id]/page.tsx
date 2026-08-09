import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
import { ajouterPaiementAction, avancerStatutAction } from "./actions";

const BUCKET = "commandes";
const HEURE_EN_SECONDES = 3600;

export default async function CommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: commande } = await supabase
    .from("commandes")
    .select(
      "id, nom_modele, statut, prix_total, date_essayage, date_livraison, photo_modele_url, photo_tissu_url, client_id, atelier_id, clients(nom, whatsapp, telephone)"
    )
    .eq("id", id)
    .single();

  if (!commande) {
    notFound();
  }

  const client = commande.clients as unknown as {
    nom: string;
    whatsapp: string | null;
    telephone: string | null;
  } | null;

  const { data: atelier } = await supabase
    .from("ateliers")
    .select("nom")
    .eq("id", commande.atelier_id)
    .single();

  const { data: paiements } = await supabase
    .from("paiements")
    .select("id, montant, type, created_at")
    .eq("commande_id", id)
    .order("created_at");

  const totalPaye =
    paiements?.reduce((somme, paiement) => somme + Number(paiement.montant), 0) ?? 0;
  const resteAPayer = Number(commande.prix_total) - totalPaye;

  const statut = commande.statut as Statut;
  const suivant = statutSuivant(statut);
  const niveau = priorite(commande.date_livraison, statut);

  // Bucket prive : il faut une URL signee pour afficher les photos.
  const cheminsPhotos = [commande.photo_modele_url, commande.photo_tissu_url].filter(
    (chemin): chemin is string => Boolean(chemin)
  );
  const { data: photosSignees } = cheminsPhotos.length
    ? await supabase.storage.from(BUCKET).createSignedUrls(cheminsPhotos, HEURE_EN_SECONDES)
    : { data: null };

  const photos =
    photosSignees?.flatMap((photo) =>
      photo.signedUrl ? [{ path: photo.path ?? photo.signedUrl, url: photo.signedUrl }] : []
    ) ?? [];

  const numero = client?.whatsapp ?? client?.telephone ?? null;
  const nomAtelier = atelier?.nom ?? "notre atelier";
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
      label: "Envoyer le recapitulatif",
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
      label: "Prevenir que c'est pret",
      texte: messagePret(nomAtelier, nomClient, donneesMessage, resteAPayer),
      visible: statut === "pret",
    },
  ].filter((message) => message.visible);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href="/commandes" className="text-sm text-zinc-500">
        &larr; Retour
      </Link>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            {commande.nom_modele ?? "Commande"}
          </h1>
          <Link
            href={`/clients/${commande.client_id}`}
            className="text-sm text-zinc-500 underline"
          >
            {client?.nom ?? "Client inconnu"}
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
          <form action={avancerStatutAction} className="mt-3">
            <input type="hidden" name="commande_id" value={commande.id} />
            <input type="hidden" name="statut" value={suivant} />
            <button
              type="submit"
              className="w-full rounded-xl bg-zinc-900 px-4 py-4 text-base font-medium text-white active:bg-zinc-700"
            >
              Passer a : {STATUT_LABELS[suivant]}
            </button>
          </form>
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
            Aucun numero enregistre pour ce client.
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
              : "Non definie"}
          </span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-zinc-500">Livraison</span>
          <span className="font-medium text-zinc-900">
            {commande.date_livraison
              ? new Date(commande.date_livraison).toLocaleDateString("fr-FR")
              : "Non definie"}
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
          <span className="text-zinc-500">Deja verse</span>
          <span className="font-medium text-zinc-900">{formaterMontant(totalPaye)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-zinc-100 pt-2 text-base">
          <span className="font-medium text-zinc-700">Reste a payer</span>
          <span
            className={`font-semibold ${
              resteAPayer > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {formaterMontant(resteAPayer)}
          </span>
        </div>

        {resteAPayer > 0 && (
          <form action={ajouterPaiementAction} className="mt-3 flex gap-2">
            <input type="hidden" name="commande_id" value={commande.id} />
            <input
              name="montant"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Montant recu"
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

        {paiements && paiements.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1 border-t border-zinc-100 pt-3">
            {paiements.map((paiement) => (
              <li key={paiement.id} className="flex justify-between text-sm text-zinc-500">
                <span>
                  {new Date(paiement.created_at).toLocaleDateString("fr-FR")} ·{" "}
                  {paiement.type}
                </span>
                <span>{formaterMontant(Number(paiement.montant))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {photos.length > 0 && (
        <section className="mt-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Photos</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.path}
                className="relative aspect-square overflow-hidden rounded-xl bg-zinc-200"
              >
                <Image
                  src={photo.url}
                  alt="Photo de la commande"
                  fill
                  sizes="(max-width: 640px) 50vw, 320px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
