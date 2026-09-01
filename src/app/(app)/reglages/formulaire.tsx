"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { rafraichirMiroir } from "@/lib/offline/miroir";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { useHydratation } from "@/lib/hydratation";
import { LANGUES, estLangue, traduire } from "@/lib/i18n";
import { Bouton } from "@/ui/bouton";
import { Champ } from "@/ui/champ";
import { Message } from "@/ui/message";

type Etat = "repos" | "envoi" | "enregistre" | "echec";

export function FormulaireReglages({
  atelierId,
  utilisateurId,
  nomAtelier,
  nomUtilisateur,
  telephoneAtelier,
  whatsappAtelier,
  langueAtelier,
}: {
  atelierId: string;
  utilisateurId: string;
  nomAtelier: string;
  nomUtilisateur: string;
  telephoneAtelier: string;
  whatsappAtelier: string;
  langueAtelier: string;
}) {
  const mots = traduire(langueAtelier);
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
    const telephone = String(formulaire.get("telephone") ?? "").trim();
    const whatsapp = String(formulaire.get("whatsapp") ?? "").trim();
    // Revalide malgre le menu deroulant : la base porte une contrainte, et
    // un envoi fabrique a la main y ferait echouer tout l'enregistrement.
    const choisie = formulaire.get("langue");
    const langue = estLangue(choisie) ? choisie : langueAtelier;

    if (!atelier || !utilisateur) {
      setEtat("echec");
      return;
    }

    const supabase = createClient();

    const [reponseAtelier, reponseUtilisateur] = await Promise.all([
      supabase
        .from("ateliers")
        .update({
          nom: atelier,
          // Un champ vide efface la coordonnee plutot que d'y ranger une
          // chaine vide, que le recu afficherait comme un libelle sans rien.
          telephone: telephone || null,
          whatsapp_number: whatsapp || null,
          langue,
        })
        .eq("id", atelierId),
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
      <Champ
        id="atelier"
        name="atelier"
        type="text"
        libelle={mots.reglagesEcran.nomAtelier}
        aide={mots.reglagesEcran.aideNomAtelier}
        defaultValue={nomAtelier}
        required
      />

      {/*
       * Les deux coordonnees de l'atelier, et non celles de la personne
       * connectee : c'est l'atelier que le client rappelle, et le recu
       * peut avoir ete etabli par un apprenti.
       */}
      <Champ
        id="telephone"
        name="telephone"
        type="tel"
        libelle={mots.reglagesEcran.telephoneAtelier}
        aide={mots.reglagesEcran.aideTelephoneAtelier}
        defaultValue={telephoneAtelier}
        autoComplete="tel"
        inputMode="tel"
      />

      <Champ
        id="whatsapp"
        name="whatsapp"
        type="tel"
        libelle={mots.reglagesEcran.whatsappAtelier}
        aide={mots.reglagesEcran.aideWhatsappAtelier}
        defaultValue={whatsappAtelier}
        inputMode="tel"
      />

      <Champ
        id="utilisateur"
        name="utilisateur"
        type="text"
        libelle={mots.reglagesEcran.votreNom}
        defaultValue={nomUtilisateur}
        autoComplete="name"
        required
      />

      {/*
       * La langue est portee par l'atelier et non par le compte : les
       * documents qui sortent doivent suivre la meme langue quel que soit
       * l'apprenti qui les produit.
       *
       * Chaque langue est ecrite dans la sienne - un anglophone doit
       * reconnaitre « English » sur une interface encore francaise.
       */}
      <div>
        <label htmlFor="langue" className="block text-sm font-medium text-encre">
          {mots.champLangue}
        </label>
        <p className="mt-1 text-xs text-gris">{mots.aideLangue}</p>
        <select
          id="langue"
          name="langue"
          defaultValue={langueAtelier}
          className="mt-1.5 min-h-11 w-full rounded-controle border border-bordure px-4 py-3 text-base transition-colors duration-150 ease-doux hover:border-vert-pale"
        >
          {LANGUES.map((code) => (
            <option key={code} value={code}>
              {mots.langues[code]}
            </option>
          ))}
        </select>
      </div>

      {etat === "echec" && (
        <Message ton="probleme">
          {mots.reglagesEcran.echecEnregistrement}
        </Message>
      )}

      {etat === "enregistre" && (
        <Message ton="metier">{mots.reglagesEcran.enregistre}</Message>
      )}

      <Bouton
        type="submit"
        disabled={!pret || horsLigne || etat === "envoi"}
        pleineLargeur
        classe="mt-2 min-h-12"
      >
        {etat === "envoi"
          ? mots.formulaires.enregistrement
          : mots.formulaires.enregistrer}
      </Bouton>

      {horsLigne && (
        <p className="text-xs text-gris">
          {mots.reglagesEcran.modificationHorsLigne}
        </p>
      )}
    </form>
  );
}
