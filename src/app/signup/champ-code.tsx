"use client";

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
export function ChampCode({
  valeur,
  surSaisie,
  ouvert,
  surOuverture,
  impose,
}: {
  valeur: string;
  surSaisie: (valeur: string) => void;
  ouvert: boolean;
  surOuverture: () => void;
  /** Code recu par lien : le champ s'affiche deja rempli. */
  impose: boolean;
}) {
  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={surOuverture}
        className="self-start text-sm text-gris underline underline-offset-2 hover:text-encre"
      >
        J&apos;ai un code d&apos;invitation
      </button>
    );
  }

  return (
    <div>
      <label htmlFor="code" className="block text-sm font-medium text-encre">
        Code d&apos;invitation
      </label>
      {impose && (
        <p className="mt-1 text-xs text-gris">
          Fourni par le propriétaire de l&apos;atelier.
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
