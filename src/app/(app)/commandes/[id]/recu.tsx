"use client";

import { useState } from "react";
import { genererRecu, type DonneesRecu } from "@/lib/recu";

export function BoutonRecu({ donnees }: { donnees: DonneesRecu }) {
  const [etat, setEtat] = useState<"pret" | "generation" | "erreur">("pret");

  async function partager() {
    setEtat("generation");

    try {
      const blob = await genererRecu(donnees);
      const nom = `recu-${donnees.client.replace(/\s+/g, "-").toLowerCase()}.jpg`;
      const fichier = new File([blob], nom, { type: "image/jpeg" });

      // Le partage natif ouvre WhatsApp directement depuis le telephone.
      if (navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: "Reçu" });
      } else {
        const url = URL.createObjectURL(blob);
        const lien = document.createElement("a");
        lien.href = url;
        lien.download = nom;
        lien.click();
        URL.revokeObjectURL(url);
      }

      setEtat("pret");
    } catch {
      // Un partage annule par l'utilisateur ne doit pas ressembler a une panne.
      setEtat("pret");
    }
  }

  return (
    <button
      type="button"
      onClick={partager}
      disabled={etat === "generation"}
      className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 active:bg-zinc-100 disabled:opacity-60"
    >
      {etat === "generation" ? "Préparation..." : "Partager le reçu"}
    </button>
  );
}
