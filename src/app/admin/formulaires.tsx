"use client";

import { useActionState } from "react";
import { Trash, UserPlus } from "@phosphor-icons/react/dist/ssr";
import { CODES_FORMULES, plafonds } from "@/lib/formules";
import { Message } from "@/ui/message";
import {
  actionChangerFormule,
  actionNommer,
  actionRevoquer,
  type Resultat,
} from "./actions";

const DEPART: Resultat = { erreur: null };

/**
 * Changer l'offre d'un atelier.
 *
 * Le choix s'envoie a la selection, sans bouton de validation : c'est le
 * seul geste de la ligne, et un bouton « Enregistrer » a cote d'un menu
 * qui n'a qu'un usage n'ajoute qu'une occasion d'oublier de cliquer.
 */
export function ChangerFormule({
  atelier,
  formule,
}: {
  atelier: string;
  formule: string;
}) {
  const [etat, agir, occupe] = useActionState(actionChangerFormule, DEPART);

  return (
    <form action={agir} className="flex flex-col items-end gap-1">
      <input type="hidden" name="atelier" value={atelier} />
      <label className="sr-only" htmlFor={`formule-${atelier}`}>
        Offre de cet atelier
      </label>
      <select
        id={`formule-${atelier}`}
        name="formule"
        defaultValue={formule}
        disabled={occupe}
        onChange={(evenement) => evenement.currentTarget.form?.requestSubmit()}
        className="min-h-11 rounded-controle border border-bordure bg-white px-3 text-sm text-encre transition-colors hover:border-vert-pale disabled:opacity-50"
      >
        {CODES_FORMULES.map((code) => (
          <option key={code} value={code}>
            {plafonds(code).nom}
          </option>
        ))}
      </select>
      {etat.erreur && (
        <span className="text-xs font-medium text-rouge">{etat.erreur}</span>
      )}
    </form>
  );
}

export function NommerAdministrateur() {
  const [etat, agir, occupe] = useActionState(actionNommer, DEPART);

  return (
    <form action={agir} className="mt-3">
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="email-admin">
          Adresse du compte à nommer
        </label>
        <input
          id="email-admin"
          name="email"
          type="email"
          required
          placeholder="adresse@exemple.bj"
          className="min-h-11 min-w-0 flex-1 rounded-controle border border-bordure bg-white px-4 text-base text-encre transition-colors hover:border-vert-pale"
        />
        <button
          type="submit"
          disabled={occupe}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-controle bg-foret px-4 text-sm font-medium text-white transition-colors hover:bg-vert disabled:opacity-50"
        >
          <UserPlus size={16} />
          {occupe ? "..." : "Nommer"}
        </button>
      </div>

      <p className="mt-2 text-xs text-gris">
        Le compte doit déjà exister sur TailorHub. Il gardera son atelier :
        être administrateur ne change rien à ce qu&apos;il fait chez lui.
      </p>

      {etat.erreur && (
        <div className="mt-3">
          <Message ton="probleme">{etat.erreur}</Message>
        </div>
      )}
    </form>
  );
}

export function RevoquerAdministrateur({
  compte,
  soiMeme,
}: {
  compte: string;
  soiMeme: boolean;
}) {
  const [etat, agir, occupe] = useActionState(actionRevoquer, DEPART);

  /*
   * Pas de bouton sur sa propre ligne. La base refuse l'auto-revocation -
   * c'est elle qui garantit qu'il reste toujours un administrateur - et
   * offrir un bouton qui ne peut que refuser serait un piege.
   */
  if (soiMeme) {
    return <span className="text-xs text-gris">vous</span>;
  }

  return (
    <form action={agir} className="flex flex-col items-end gap-1">
      <input type="hidden" name="compte" value={compte} />
      <button
        type="submit"
        disabled={occupe}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-controle border border-bordure px-3 text-xs font-medium text-gris transition-colors hover:border-rouge hover:text-rouge disabled:opacity-50"
      >
        <Trash size={13} />
        {occupe ? "..." : "Retirer"}
      </button>
      {etat.erreur && (
        <span className="text-xs font-medium text-rouge">{etat.erreur}</span>
      )}
    </form>
  );
}
