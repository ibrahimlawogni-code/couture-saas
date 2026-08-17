import { classes } from "./classes";

/*
 * Libelle, champ, aide et erreur d'un seul tenant.
 *
 * Les formulaires reecrivaient ce bloc a chaque ligne, et l'erreur n'etait
 * jamais rattachee au champ concerne : elle s'affichait en tete de
 * formulaire, ce qu'un lecteur d'ecran n'annonce pas au moment ou la
 * personne arrive sur le champ fautif. aria-describedby et aria-invalid
 * sont poses ici, une fois pour toutes.
 */

const CHAMP =
  "w-full rounded-controle border bg-white px-4 text-base text-encre " +
  "transition-colors duration-150 ease-doux placeholder:text-gris";

const NORMAL = "border-bordure hover:border-vert-pale";
const FAUTIF = "border-rouge";

type Enveloppe = {
  id: string;
  libelle: string;
  /** Precision affichee sous le libelle, avant la saisie. */
  aide?: string;
  erreur?: string | null;
  classe?: string;
};

function Enrobage({
  id,
  libelle,
  aide,
  erreur,
  classe,
  children,
}: Enveloppe & { children: React.ReactNode }) {
  return (
    <div className={classes("flex flex-col gap-1.5", classe)}>
      <label htmlFor={id} className="text-sm font-medium text-encre">
        {libelle}
      </label>
      {aide && (
        <p id={`${id}-aide`} className="text-xs text-gris">
          {aide}
        </p>
      )}
      {children}
      {erreur && (
        <p id={`${id}-erreur`} className="text-xs font-medium text-rouge">
          {erreur}
        </p>
      )}
    </div>
  );
}

/** Reference les descriptions reellement presentes, et rien d'autre. */
function decrivants(id: string, aide?: string, erreur?: string | null) {
  const parties = [aide && `${id}-aide`, erreur && `${id}-erreur`].filter(Boolean);
  return parties.length > 0 ? parties.join(" ") : undefined;
}

export function Champ({
  id,
  libelle,
  aide,
  erreur,
  classe,
  ...reste
}: Enveloppe & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Enrobage id={id} libelle={libelle} aide={aide} erreur={erreur} classe={classe}>
      <input
        {...reste}
        id={id}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrivants(id, aide, erreur)}
        className={classes(CHAMP, "min-h-11 py-3", erreur ? FAUTIF : NORMAL)}
      />
    </Enrobage>
  );
}

export function ZoneTexte({
  id,
  libelle,
  aide,
  erreur,
  classe,
  ...reste
}: Enveloppe & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Enrobage id={id} libelle={libelle} aide={aide} erreur={erreur} classe={classe}>
      <textarea
        {...reste}
        id={id}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrivants(id, aide, erreur)}
        className={classes(CHAMP, "py-3", erreur ? FAUTIF : NORMAL)}
      />
    </Enrobage>
  );
}

export function Selecteur({
  id,
  libelle,
  aide,
  erreur,
  classe,
  children,
  ...reste
}: Enveloppe & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Enrobage id={id} libelle={libelle} aide={aide} erreur={erreur} classe={classe}>
      <select
        {...reste}
        id={id}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrivants(id, aide, erreur)}
        className={classes(CHAMP, "min-h-11 py-3", erreur ? FAUTIF : NORMAL)}
      >
        {children}
      </select>
    </Enrobage>
  );
}
