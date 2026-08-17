"use client";

import { useState } from "react";
import { Receipt } from "@phosphor-icons/react/dist/ssr";
import { genererRecu, type DonneesRecu } from "@/lib/recu";
import { Bouton } from "@/ui/bouton";

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
        /*
         * Repli sans partage natif, sur ordinateur notamment.
         *
         * L'ancre est posee dans le document avant d'etre cliquee, et
         * l'URL n'est liberee qu'au tour de boucle suivant. Le code
         * precedent cliquait une ancre detachee puis revoquait aussitot :
         * le navigateur pouvait liberer le blob avant de l'avoir lu, et le
         * telechargement n'arrivait jamais. L'echec etait muet, le bouton
         * revenant simplement a son etat de repos.
         */
        const url = URL.createObjectURL(blob);
        const lien = document.createElement("a");
        lien.href = url;
        lien.download = nom;
        lien.style.display = "none";
        document.body.appendChild(lien);
        lien.click();

        setTimeout(() => {
          lien.remove();
          URL.revokeObjectURL(url);
        }, 0);
      }

      setEtat("pret");
    } catch {
      // Un partage annule par l'utilisateur ne doit pas ressembler a une panne.
      setEtat("pret");
    }
  }

  return (
    <Bouton
      type="button"
      allure="secondaire"
      pleineLargeur
      onClick={partager}
      disabled={etat === "generation"}
    >
      <Receipt size={16} />
      {etat === "generation" ? "Préparation..." : "Partager le reçu"}
    </Bouton>
  );
}
