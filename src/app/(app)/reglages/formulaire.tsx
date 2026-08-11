"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { rafraichirMiroir } from "@/lib/offline/miroir";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { useHydratation } from "@/lib/hydratation";

type Etat = "repos" | "envoi" | "enregistre" | "echec";

export function FormulaireReglages({
  atelierId,
  utilisateurId,
  nomAtelier,
  nomUtilisateur,
}: {
  atelierId: string;
  utilisateurId: string;
  nomAtelier: string;
  nomUtilisateur: string;
}) {
  const router = useRouter();
  const pret = useHydratation();
  const { horsLigne } = useFileAttente();
  const [etat, setEtat] = useState<Etat>("repos");

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setEtat("envoi");

    const formulaire = new FormData(evenement.currentTarget);
    const atelier = String(formulaire.get("atelier") ?? "").trim();
    const utilisateur = String(formulaire.get("utilisateur") ?? "").trim();

    if (!atelier || !utilisateur) {
      setEtat("echec");
      return;
    }

    const supabase = createClient();

    const [reponseAtelier, reponseUtilisateur] = await Promise.all([
      supabase.from("ateliers").update({ nom: atelier }).eq("id", atelierId),
      supabase.from("utilisateurs").update({ nom: utilisateur }).eq("id", utilisateurId),
    ]);

    if (reponseAtelier.error || reponseUtilisateur.error) {
      setEtat("echec");
      return;
    }

    await rafraichirMiroir();
    setEtat("enregistre");
    // L'en-tete est rendu par le serveur : sans cela, l'ancien nom resterait
    // affiche jusqu'au prochain chargement complet.
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="atelier" className="block text-sm font-medium text-encre">
          Nom de l&apos;atelier
        </label>
        <p className="mt-1 text-xs text-gris">
          Il apparaît sur les reçus et les messages envoyés à vos clients.
        </p>
        <input
          id="atelier"
          name="atelier"
          type="text"
          defaultValue={nomAtelier}
          required
          className="mt-2 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
        />
      </div>

      <div>
        <label htmlFor="utilisateur" className="block text-sm font-medium text-encre">
          Votre nom
        </label>
        <input
          id="utilisateur"
          name="utilisateur"
          type="text"
          defaultValue={nomUtilisateur}
          required
          className="mt-2 w-full rounded-2xl border border-bordure px-4 py-3 text-base"
        />
      </div>

      {etat === "echec" && (
        <p className="rounded-2xl bg-rouge-clair px-4 py-3 text-sm text-rouge">
          L&apos;enregistrement n&apos;a pas abouti. Réessayez.
        </p>
      )}

      {etat === "enregistre" && (
        <p className="rounded-2xl bg-vert-clair px-4 py-3 text-sm text-foret">
          Modifications enregistrées.
        </p>
      )}

      <button
        type="submit"
        disabled={!pret || horsLigne || etat === "envoi"}
        className="mt-2 rounded-2xl bg-foret px-4 py-4 text-base font-medium text-white active:bg-vert disabled:opacity-40"
      >
        {etat === "envoi" ? "Enregistrement..." : "Enregistrer"}
      </button>

      {horsLigne && (
        <p className="text-xs text-gris">
          Cette modification demande une connexion.
        </p>
      )}
    </form>
  );
}
