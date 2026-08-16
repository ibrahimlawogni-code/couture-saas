"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enregistrer } from "@/lib/offline/enregistrer";
import { useHydratation } from "@/lib/hydratation";
import { Bouton } from "@/ui/bouton";
import { Champ } from "@/ui/champ";

/*
 * L'unite ne figure plus dans chaque libelle. Sept « (cm) » empiles dans
 * une grille a deux colonnes allongeaient les libelles jusqu'au retour a
 * la ligne, pour repeter sept fois la meme chose ; elle est dite une fois,
 * au-dessus de la grille.
 */
const CHAMPS_STANDARDS: { cle: string; label: string }[] = [
  { cle: "poitrine", label: "Poitrine" },
  { cle: "taille", label: "Taille" },
  { cle: "hanches", label: "Hanches" },
  { cle: "longueur_bras", label: "Longueur bras" },
  { cle: "longueur_jambe", label: "Longueur jambe" },
  { cle: "col", label: "Col" },
  { cle: "epaule", label: "Épaule" },
];

export function FormulaireMesure({
  clientId,
  utilisateurId,
}: {
  clientId: string;
  utilisateurId: string;
}) {
  const router = useRouter();
  const pret = useHydratation();
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setEnvoi(true);

    const formulaire = new FormData(evenement.currentTarget);
    const valeurs: Record<string, number | string> = {};

    for (const champ of CHAMPS_STANDARDS) {
      const valeur = formulaire.get(champ.cle);
      if (valeur && String(valeur).trim() !== "") {
        valeurs[champ.cle] = Number(valeur);
      }
    }

    const customNom = String(formulaire.get("champ_custom_nom") ?? "").trim();
    const customValeur = String(formulaire.get("champ_custom_valeur") ?? "").trim();
    if (customNom && customValeur) {
      valeurs[customNom] = customValeur;
    }

    await enregistrer("mesures", {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      client_id: clientId,
      libelle: String(formulaire.get("libelle") ?? "Mesures").trim() || "Mesures",
      valeurs,
      pris_par: utilisateurId,
    });

    router.push(`/clients/${clientId}`);
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} className="mt-6 flex flex-col gap-4">
      <Champ
        id="libelle"
        name="libelle"
        type="text"
        libelle="Libellé"
        aide="Pour retrouver ces mesures plus tard : « Boubou », « Costume »…"
        defaultValue="Mesures"
      />

      <fieldset>
        <legend className="text-sm font-medium text-encre">
          Mesures standard
        </legend>
        <p className="mt-1 text-xs text-gris">
          Toutes les valeurs en centimètres. Laissez vide ce que vous ne prenez
          pas.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {CHAMPS_STANDARDS.map((champ) => (
            <Champ
              key={champ.cle}
              id={champ.cle}
              name={champ.cle}
              type="number"
              libelle={champ.label}
              step="0.5"
              min="0"
              inputMode="decimal"
            />
          ))}
        </div>
      </fieldset>

      {/*
       * Les deux champs n'avaient qu'un texte d'invite, pas de libelle :
       * une fois remplis, plus rien ne disait ce qu'ils contenaient, et un
       * lecteur d'ecran ne les annoncait pas du tout.
       */}
      <fieldset className="rounded-carte border border-dashed border-bordure p-4">
        <legend className="px-1 text-sm font-medium text-encre">
          Champ personnalisé
        </legend>
        <p className="text-xs text-gris">
          Pour une mesure propre à votre pratique. Les deux cases doivent être
          remplies pour être enregistrées.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Champ
            id="champ_custom_nom"
            name="champ_custom_nom"
            type="text"
            libelle="Nom"
            placeholder="Tour de cuisse"
          />
          <Champ
            id="champ_custom_valeur"
            name="champ_custom_valeur"
            type="text"
            libelle="Valeur"
            placeholder="58"
          />
        </div>
      </fieldset>

      <Bouton
        type="submit"
        disabled={!pret || envoi}
        pleineLargeur
        classe="mt-2 min-h-12"
      >
        {!pret ? "Chargement..." : envoi ? "Enregistrement..." : "Enregistrer"}
      </Bouton>
    </form>
  );
}
