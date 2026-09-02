"use client";

import { useState } from "react";
import { CheckCircle, Star } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { Bouton } from "@/ui/bouton";
import { traduire } from "@/lib/i18n";
import { Message } from "@/ui/message";
import { ZoneTexte } from "@/ui/champ";

/*
 * Les cinq degres portent un mot, pas seulement un nombre d'etoiles.
 *
 * « 3 sur 5 » ne veut pas la meme chose pour tout le monde, et la personne
 * qui note ici n'a aucune habitude de l'echelle du produit. Le mot leve
 * l'ambiguite au moment du choix, et c'est lui qu'annonce un lecteur
 * d'ecran.
 */
const NOTES = [1, 2, 3, 4, 5] as const;

/*
 * Les motifs que Postgres renvoie, et rien d'autre. Les phrases vivent
 * dans le dictionnaire, ou elles existent en deux langues : le message
 * d'erreur arrive en anglais avec le prefixe de la fonction, et c'est ce
 * prefixe seul qu'on reconnait.
 */
const MOTIFS = ["deja_note", "commande_introuvable", "note_invalide"] as const;

export function FormulaireAvis({
  jeton,
  atelier,
  modele,
  langue,
}: {
  jeton: string;
  atelier: string;
  modele: string | null;
  /* Le code de langue et non le dictionnaire : cet ecran est rendu par le
     serveur, que les fonctions d'accord ne peuvent pas traverser. */
  langue: string;
}) {
  const mots = traduire(langue);
  const [note, setNote] = useState<number | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [merci, setMerci] = useState(false);

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (note === null) return;

    setEnvoi(true);
    setErreur(null);

    const commentaire = String(
      new FormData(evenement.currentTarget).get("commentaire") ?? ""
    );

    const supabase = createClient();
    const { error } = await supabase.rpc("laisser_avis", {
      jeton,
      note,
      commentaire: commentaire.trim() || null,
    });

    if (error) {
      /*
       * Le message de Postgres arrive en anglais, avec le prefixe de la
       * fonction. On ne montre que ce qu'on a soi-meme leve ; tout le
       * reste devient une phrase neutre plutot qu'une trace technique.
       */
      const cle = MOTIFS.find((motif) => error.message.includes(motif));
      setErreur(mots.avis.erreurs[cle ?? "envoi"]);
      setEnvoi(false);
      return;
    }

    setMerci(true);
  }

  if (merci) {
    return (
      <div className="text-center">
        <CheckCircle size={36} weight="fill" className="mx-auto text-vert" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-encre">
          {mots.avis.merci}
        </h1>
        <p className="mt-2 leading-relaxed text-gris">
          {mots.avis.merciTexte(atelier)}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={soumettre}>
      <h1 className="text-xl font-semibold tracking-tight text-encre">
        {mots.avis.question}
      </h1>
      {/*
       * « Votre » plutot qu'un participe accorde : les modeles sont des
       * deux genres - une Robe, un Boubou - et aucune formulation avec
       * accord ne peut les couvrir tous sans se tromper une fois sur deux.
       */}
      <p className="mt-2 text-sm text-gris">
        {mots.avis.intro(modele ?? mots.avis.commande, atelier)}
      </p>

      {erreur && (
        <div className="mt-5">
          <Message ton="probleme">{erreur}</Message>
        </div>
      )}

      {/*
       * Des boutons radio, et non des boutons ordinaires : la navigation au
       * clavier, l'annonce « 3 sur 5 » et le groupement viennent alors du
       * navigateur, sans avoir a les reconstruire.
       */}
      <fieldset className="mt-6">
        <legend className="sr-only">{mots.avis.question}</legend>
        <div className="flex justify-between gap-1">
          {NOTES.map((degre) => {
            const choisi = note !== null && degre <= note;

            return (
              <label
                key={degre}
                className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-controle py-2 transition-colors duration-150 ease-doux hover:bg-papier has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vert"
              >
                <input
                  type="radio"
                  name="note"
                  value={degre}
                  checked={note === degre}
                  onChange={() => setNote(degre)}
                  className="sr-only"
                />
                <Star
                  size={30}
                  weight={choisi ? "fill" : "regular"}
                  className={choisi ? "text-ambre" : "text-bordure"}
                  aria-hidden
                />
                <span
                  className={`text-center text-[0.6875rem] leading-tight ${
                    note === degre ? "font-semibold text-encre" : "text-gris"
                  }`}
                >
                  {mots.avis.mots[degre]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6">
        <ZoneTexte
          id="commentaire"
          name="commentaire"
          libelle={mots.avis.unMot}
          aide={mots.avis.facultatif}
          rows={3}
          maxLength={500}
          placeholder={mots.avis.exempleCommentaire}
        />
      </div>

      <Bouton
        type="submit"
        disabled={note === null || envoi}
        pleineLargeur
        classe="mt-6 min-h-12"
      >
        {envoi ? mots.avis.envoiEnCours : mots.avis.envoyer}
      </Bouton>
    </form>
  );
}
