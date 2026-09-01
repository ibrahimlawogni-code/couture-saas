"use client";

import { traduire, type Langue } from "@/lib/i18n";

/**
 * La plupart des gens qui creent un atelier n'ont pas de code. Leur montrer
 * un champ vide de plus ajoute une friction et fait deborder le formulaire
 * de l'ecran sur un portable agrandi. Il ne s'ouvre donc qu'a la demande.
 *
 * Celui qui arrive avec un code dans le lien voit le champ d'emblee, rempli.
 *
 * Composant controle : la saisie d'un code ne concerne pas que ce champ.
 * Elle decide aussi du titre de la page, du libelle du bouton et de la
 * presence du champ « Nom de l'atelier » - qu'un code rend inutile, la
 * base rattachant alors la personne a l'atelier existant. L'etat est donc
 * tenu par le formulaire, pas ici.
 */
/*
 * La langue et non le dictionnaire.
 *
 * Ce composant est rendu cote client, et certains ecrans qui l'affichent
 * sont rendus cote serveur. Or le dictionnaire porte des fonctions - celles
 * qui accordent les phrases au nombre - et une fonction ne franchit pas la
 * frontiere serveur vers client. On passe donc le code de langue, qui est
 * une chaine, et on relit le dictionnaire ici.
 */
export function ChampCode({
  langue,
  valeur,
  surSaisie,
  ouvert,
  surOuverture,
  impose,
}: {
  langue: Langue;
  valeur: string;
  surSaisie: (valeur: string) => void;
  ouvert: boolean;
  surOuverture: () => void;
  /** Code recu par lien : le champ s'affiche deja rempli. */
  impose: boolean;
}) {
  const mots = traduire(langue);
  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={surOuverture}
        className="self-start text-sm text-gris underline underline-offset-2 hover:text-encre"
      >
        {mots.acces.jaiUnCode}
      </button>
    );
  }

  return (
    <div>
      <label htmlFor="code" className="block text-sm font-medium text-encre">
        {mots.acces.codeInvitation}
      </label>
      {impose && (
        <p className="mt-1 text-xs text-gris">
          {mots.acces.aideCodeInvitation}
        </p>
      )}
      <input
        id="code"
        name="code"
        type="text"
        value={valeur}
        onChange={(evenement) => surSaisie(evenement.target.value.toUpperCase())}
        autoComplete="off"
        spellCheck={false}
        autoFocus={!impose}
        className="mt-1.5 w-full rounded-controle border border-bordure px-4 py-3 text-base tracking-[0.2em] uppercase"
      />
    </div>
  );
}
