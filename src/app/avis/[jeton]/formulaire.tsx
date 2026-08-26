"use client";

import { useState } from "react";
import { CheckCircle, Star } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { Bouton } from "@/ui/bouton";
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
const DEGRES = [
  { note: 1, mot: "Très déçu" },
  { note: 2, mot: "Déçu" },
  { note: 3, mot: "Correct" },
  { note: 4, mot: "Content" },
  { note: 5, mot: "Très content" },
] as const;

const MESSAGES: Record<string, string> = {
  deja_note: "Un avis a déjà été donné pour cette commande.",
  commande_introuvable: "Ce lien n'est plus valable.",
  note_invalide: "Choisissez une note entre 1 et 5.",
};

export function FormulaireAvis({
  jeton,
  atelier,
  modele,
}: {
  jeton: string;
  atelier: string;
  modele: string | null;
}) {
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
      const cle = Object.keys(MESSAGES).find((motif) =>
        error.message.includes(motif)
      );
      setErreur(
        cle
          ? MESSAGES[cle]
          : "L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez."
      );
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
          Merci !
        </h1>
        <p className="mt-2 leading-relaxed text-gris">
          Votre avis est arrivé chez {atelier}. Vous pouvez fermer cette page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={soumettre}>
      <h1 className="text-xl font-semibold tracking-tight text-encre">
        Comment s&apos;est passée votre commande ?
      </h1>
      {/*
       * « Votre » plutot qu'un participe accorde : les modeles sont des
       * deux genres - une Robe, un Boubou - et aucune formulation avec
       * accord ne peut les couvrir tous sans se tromper une fois sur deux.
       */}
      <p className="mt-2 text-sm text-gris">
        Votre {modele ?? "commande"} chez{" "}
        <span className="font-medium text-encre">{atelier}</span>.
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
        <legend className="sr-only">Votre note, de 1 à 5</legend>
        <div className="flex justify-between gap-1">
          {DEGRES.map((degre) => {
            const choisi = note !== null && degre.note <= note;

            return (
              <label
                key={degre.note}
                className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-controle py-2 transition-colors duration-150 ease-doux hover:bg-papier has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vert"
              >
                <input
                  type="radio"
                  name="note"
                  value={degre.note}
                  checked={note === degre.note}
                  onChange={() => setNote(degre.note)}
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
                    note === degre.note ? "font-semibold text-encre" : "text-gris"
                  }`}
                >
                  {degre.mot}
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
          libelle="Un mot pour l'atelier"
          aide="Facultatif"
          rows={3}
          maxLength={500}
          placeholder="Ce qui vous a plu, ou ce qui pourrait être mieux..."
        />
      </div>

      <Bouton
        type="submit"
        disabled={note === null || envoi}
        pleineLargeur
        classe="mt-6 min-h-12"
      >
        {envoi ? "Envoi..." : "Envoyer mon avis"}
      </Bouton>
    </form>
  );
}
