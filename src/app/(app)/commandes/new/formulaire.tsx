"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { enregistrer } from "@/lib/offline/enregistrer";
import { messageRefus } from "@/lib/offline/erreurs";
import { cheminPhoto, compresserPhoto } from "@/lib/offline/photo";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { useHydratation } from "@/lib/hydratation";
import type { PhotoEnAttente } from "@/lib/offline/db";

type ClientOption = { id: string; nom: string };

export function FormulaireCommande({
  atelierId,
  utilisateurId,
  clients,
  clientPreselectionne,
}: {
  atelierId: string;
  utilisateurId: string;
  clients: ClientOption[];
  clientPreselectionne?: string;
}) {
  const router = useRouter();
  const { enAttente } = useFileAttente();
  const pret = useHydratation();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Un client cree hors ligne doit pouvoir recevoir une commande
  // immediatement, sans attendre sa synchronisation.
  const clientsEnAttente = enAttente
    .filter((operation) => operation.table === "clients")
    .map((operation) => ({
      id: String(operation.donnees.id),
      nom: `${String(operation.donnees.nom ?? "Sans nom")} (en attente)`,
    }));

  const tousLesClients = [...clients, ...clientsEnAttente];

  async function preparerPhoto(fichier: File | null): Promise<PhotoEnAttente | null> {
    if (!fichier || fichier.size === 0) return null;

    return {
      chemin: cheminPhoto(atelierId),
      blob: await compresserPhoto(fichier),
    };
  }

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setEnvoi(true);

    const formulaire = new FormData(evenement.currentTarget);
    const clientId = String(formulaire.get("client_id") ?? "");

    const [photoModèle, photoTissu] = await Promise.all([
      preparerPhoto(formulaire.get("photo_modele") as File | null),
      preparerPhoto(formulaire.get("photo_tissu") as File | null),
    ]);

    const photos = [photoModèle, photoTissu].filter(
      (photo): photo is PhotoEnAttente => photo !== null
    );

    // La commande fige les mesures les plus recentes connues du client.
    let mesureId: string | null = null;
    if (navigator.onLine) {
      const supabase = createClient();
      const { data } = await supabase
        .from("mesures")
        .select("id")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      mesureId = data?.id ?? null;
    }

    const commandeId = crypto.randomUUID();
    const prixTotal = Number(formulaire.get("prix_total") ?? 0);
    const acompte = Number(formulaire.get("acompte") ?? 0);

    let enFile = false;

    try {
      ({ enFile } = await enregistrer(
        "commandes",
        {
          id: commandeId,
          created_at: new Date().toISOString(),
          atelier_id: atelierId,
          client_id: clientId,
          mesure_id: mesureId,
          // Repete la valeur par defaut de la base : une commande saisie hors
          // ligne s'affiche depuis la file, ou aucune colonne n'est calculee
          // par Postgres, et se retrouverait donc sans statut dans le tableau.
          statut: "recu",
          nom_modele: String(formulaire.get("nom_modele") ?? "").trim() || null,
          photo_modele_url: photoModèle?.chemin ?? null,
          photo_tissu_url: photoTissu?.chemin ?? null,
          prix_total: prixTotal,
          date_essayage: String(formulaire.get("date_essayage") ?? "") || null,
          date_livraison: String(formulaire.get("date_livraison") ?? "") || null,
          cree_par: utilisateurId,
        },
        photos
      ));
    } catch (erreur) {
      // Refus de la base, une limite d'offre par exemple. Le paiement
      // qui suit ne doit surtout pas partir sans sa commande.
      setErreur(messageRefus(erreur));
      setEnvoi(false);
      return;
    }

    if (acompte > 0) {
      await enregistrer("paiements", {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        commande_id: commandeId,
        montant: acompte,
        type: "acompte",
      });
    }

    router.push(enFile ? "/commandes" : `/commandes/${commandeId}`);
    router.refresh();
  }

  if (tousLesClients.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gris">
          Il faut au moins un client pour créer une commande.
        </p>
        <Link
          href="/clients/new"
          className="mt-4 inline-block rounded-2xl bg-foret px-4 py-3 text-sm font-medium text-white"
        >
          Créer un client
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={soumettre} className="mt-6 flex flex-col gap-4">
      {erreur && (
        <div className="rounded-2xl bg-ambre-clair px-4 py-3 text-sm text-ambre">
          <p>{erreur}</p>
          <Link href="/#tarifs" className="mt-1 inline-block font-medium underline">
            Voir les offres
          </Link>
        </div>
      )}

      <div>
        <label htmlFor="client_id" className="block text-sm font-medium text-encre">
          Client
        </label>
        <select
          id="client_id"
          name="client_id"
          required
          defaultValue={clientPreselectionne ?? ""}
          className="mt-1 w-full rounded-2xl border border-bordure bg-white px-4 py-3 text-base"
        >
          <option value="" disabled>
            Choisir un client
          </option>
          {tousLesClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.nom}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="nom_modele" className="block text-sm font-medium text-encre">
          Modèle
        </label>
        <input
          id="nom_modele"
          name="nom_modele"
          type="text"
          placeholder="Boubou brodé, chemise..."
          className="mt-1 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="photo_modele"
            className="block text-sm font-medium text-encre"
          >
            Photo modèle
          </label>
          <input
            id="photo_modele"
            name="photo_modele"
            type="file"
            accept="image/*"
            capture="environment"
            className="mt-1 w-full rounded-2xl border border-bordure px-3 py-3 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="photo_tissu"
            className="block text-sm font-medium text-encre"
          >
            Photo tissu
          </label>
          <input
            id="photo_tissu"
            name="photo_tissu"
            type="file"
            accept="image/*"
            capture="environment"
            className="mt-1 w-full rounded-2xl border border-bordure px-3 py-3 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="prix_total" className="block text-sm font-medium text-encre">
            Prix total (FCFA)
          </label>
          <input
            id="prix_total"
            name="prix_total"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            required
            className="mt-1 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
          />
        </div>
        <div>
          <label htmlFor="acompte" className="block text-sm font-medium text-encre">
            Acompte verse
          </label>
          <input
            id="acompte"
            name="acompte"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className="mt-1 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="date_essayage"
            className="block text-sm font-medium text-encre"
          >
            Date d&apos;essayage
          </label>
          <input
            id="date_essayage"
            name="date_essayage"
            type="date"
            className="mt-1 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
          />
        </div>
        <div>
          <label
            htmlFor="date_livraison"
            className="block text-sm font-medium text-encre"
          >
            Date de livraison
          </label>
          <input
            id="date_livraison"
            name="date_livraison"
            type="date"
            className="mt-1 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!pret || envoi}
        className="mt-2 rounded-2xl bg-foret px-4 py-4 text-base font-medium text-white active:bg-vert disabled:opacity-60"
      >
        {!pret
          ? "Chargement..."
          : envoi
            ? "Enregistrement..."
            : "Enregistrer la commande"}
      </button>
    </form>
  );
}
