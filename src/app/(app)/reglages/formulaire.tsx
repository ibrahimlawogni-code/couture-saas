"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { rafraichirMiroir } from "@/lib/offline/miroir";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { useHydratation } from "@/lib/hydratation";
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
}: {
  atelierId: string;
  utilisateurId: string;
  nomAtelier: string;
  nomUtilisateur: string;
  telephoneAtelier: string;
  whatsappAtelier: string;
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
    const telephone = String(formulaire.get("telephone") ?? "").trim();
    const whatsapp = String(formulaire.get("whatsapp") ?? "").trim();

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
        libelle="Nom de l'atelier"
        aide="Il apparaît sur les reçus et les messages envoyés à vos clients."
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
        libelle="Téléphone de l'atelier"
        aide="Imprimé en pied de reçu, pour que le client puisse vous joindre."
        defaultValue={telephoneAtelier}
        autoComplete="tel"
        inputMode="tel"
      />

      <Champ
        id="whatsapp"
        name="whatsapp"
        type="tel"
        libelle="WhatsApp de l'atelier"
        aide="Laissez vide si c'est le même numéro."
        defaultValue={whatsappAtelier}
        inputMode="tel"
      />

      <Champ
        id="utilisateur"
        name="utilisateur"
        type="text"
        libelle="Votre nom"
        defaultValue={nomUtilisateur}
        autoComplete="name"
        required
      />

      {etat === "echec" && (
        <Message ton="probleme">
          L&apos;enregistrement n&apos;a pas abouti. Réessayez.
        </Message>
      )}

      {etat === "enregistre" && (
        <Message ton="metier">Modifications enregistrées.</Message>
      )}

      <Bouton
        type="submit"
        disabled={!pret || horsLigne || etat === "envoi"}
        pleineLargeur
        classe="mt-2 min-h-12"
      >
        {etat === "envoi" ? "Enregistrement..." : "Enregistrer"}
      </Bouton>

      {horsLigne && (
        <p className="text-xs text-gris">
          Cette modification demande une connexion : elle change des lignes déjà
          enregistrées, et la file locale ne sait rejouer que des créations.
        </p>
      )}
    </form>
  );
}
