"use client";

import { useTraductions } from "@/lib/offline/use-traductions";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { enregistrer } from "@/lib/offline/enregistrer";
import { estLimiteOffre, messageRefus } from "@/lib/offline/erreurs";
import { useHydratation } from "@/lib/hydratation";
import { Bouton } from "@/ui/bouton";
import { Champ, ZoneTexte } from "@/ui/champ";
import { Message } from "@/ui/message";

export function FormulaireClient({ atelierId }: { atelierId: string }) {
  const mots = useTraductions();
  const router = useRouter();
  const pret = useHydratation();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // Une limite d'offre n'est pas une panne : elle se presente autrement,
  // et surtout elle propose une issue.
  const [limite, setLimite] = useState(false);
  // Faute de saisie rattachee au champ concerne, et non affichee en tete
  // de formulaire : un lecteur d'ecran l'annonce ainsi au moment ou la
  // personne arrive sur le champ, pas avant.
  const [fauteNom, setFauteNom] = useState<string | null>(null);

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setLimite(false);
    setFauteNom(null);

    const formulaire = new FormData(evenement.currentTarget);
    const nom = String(formulaire.get("nom") ?? "").trim();

    if (!nom) {
      setFauteNom(mots.formulaires.nomObligatoire);
      return;
    }

    setEnvoi(true);

    // Identifiant genere ici : le client est utilisable immediatement,
    // meme si l'enregistrement part plus tard.
    const id = crypto.randomUUID();

    let enFile = false;

    try {
      ({ enFile } = await enregistrer("clients", {
        id,
        // Date posee ici : une saisie hors ligne doit garder l'heure a
        // laquelle elle a ete faite, pas celle de son envoi.
        created_at: new Date().toISOString(),
        atelier_id: atelierId,
        nom,
        telephone: String(formulaire.get("telephone") ?? "").trim() || null,
        whatsapp: String(formulaire.get("whatsapp") ?? "").trim() || null,
        notes: String(formulaire.get("notes") ?? "").trim() || null,
      }));
    } catch (erreur) {
      // Refus de la base, une limite d'offre par exemple : la saisie
      // reste a l'ecran pour ne rien perdre de ce qui a ete tape.
      setErreur(messageRefus(erreur));
      setLimite(estLimiteOffre(erreur));
      setEnvoi(false);
      return;
    }

    router.push(enFile ? "/clients" : `/clients/${id}`);
    router.refresh();
  }

  return (
    <form onSubmit={soumettre} noValidate className="mt-6 flex flex-col gap-4">
      {erreur &&
        (limite ? (
          <Message ton="attention" titre={erreur}>
            <Link href="/#tarifs">{mots.formulaires.voirLesOffres}</Link>
          </Message>
        ) : (
          <Message ton="probleme">{erreur}</Message>
        ))}

      <Champ
        id="nom"
        name="nom"
        type="text"
        libelle={mots.formulaires.nom}
        required
        autoComplete="name"
        erreur={fauteNom}
      />
      <Champ
        id="telephone"
        name="telephone"
        type="tel"
        libelle={mots.formulaires.telephone}
        inputMode="tel"
        autoComplete="tel"
      />
      <Champ
        id="whatsapp"
        name="whatsapp"
        type="tel"
        libelle={mots.formulaires.whatsapp}
        aide={mots.formulaires.aideWhatsapp}
        inputMode="tel"
      />
      <ZoneTexte id="notes" name="notes" libelle={mots.formulaires.notes} rows={3} />

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
