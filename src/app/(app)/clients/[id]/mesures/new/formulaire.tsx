"use client";

import { useTraductions } from "@/lib/offline/use-traductions";
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
/*
 * Les cles seulement : les libelles vivent dans le dictionnaire, ou la
 * fiche client les lit aussi. Deux endroits qui nomment la meme mesure
 * finiraient par la nommer differemment.
 */
const CHAMPS_STANDARDS = [
  "poitrine",
  "taille",
  "hanches",
  "longueur_bras",
  "longueur_jambe",
  "col",
  "epaule",
] as const;


export function FormulaireMesure({
  clientId,
  utilisateurId,
}: {
  clientId: string;
  utilisateurId: string;
}) {
  const mots = useTraductions();
  const router = useRouter();
  const pret = useHydratation();
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setEnvoi(true);

    const formulaire = new FormData(evenement.currentTarget);
    const valeurs: Record<string, number | string> = {};

    for (const cle of CHAMPS_STANDARDS) {
      const valeur = formulaire.get(cle);
      if (valeur && String(valeur).trim() !== "") {
        valeurs[cle] = Number(valeur);
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
      libelle:
        String(formulaire.get("libelle") ?? "").trim() ||
        mots.formulaires.mesuresDefaut,
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
        libelle={mots.formulaires.libelleMesure}
        aide={mots.formulaires.aideLibelleMesure}
        defaultValue={mots.formulaires.mesuresDefaut}
      />

      <fieldset>
        <legend className="text-sm font-medium text-encre">
          {mots.formulaires.mesuresStandard}
        </legend>
        <p className="mt-1 text-xs text-gris">
          {mots.formulaires.aideCentimetres}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {CHAMPS_STANDARDS.map((cle) => (
            <Champ
              key={cle}
              id={cle}
              name={cle}
              type="number"
              libelle={mots.mesuresChamps[cle]}
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
          {mots.formulaires.champPersonnalise}
        </legend>
        <p className="text-xs text-gris">
          {mots.formulaires.aideChampPersonnalise}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Champ
            id="champ_custom_nom"
            name="champ_custom_nom"
            type="text"
            libelle={mots.formulaires.nom}
            placeholder={mots.formulaires.exempleNomMesure}
          />
          <Champ
            id="champ_custom_valeur"
            name="champ_custom_valeur"
            type="text"
            libelle={mots.formulaires.valeur}
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
        {!pret
          ? mots.formulaires.chargement
          : envoi
            ? mots.formulaires.enregistrement
            : mots.formulaires.enregistrer}
      </Bouton>
    </form>
  );
}
