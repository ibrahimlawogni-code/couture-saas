"use client";

import { useState } from "react";

/**
 * La plupart des gens qui creent un atelier n'ont pas de code. Leur montrer
 * un champ vide de plus ajoute une friction et fait deborder le formulaire
 * de l'ecran sur un portable agrandi. Il ne s'ouvre donc qu'a la demande.
 *
 * Celui qui arrive avec un code dans le lien voit le champ d'emblee, rempli.
 */
export function ChampCode({ code }: { code?: string }) {
  const rejoint = Boolean(code);
  const [ouvert, setOuvert] = useState(rejoint);

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
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
      {rejoint && (
        <p className="mt-1 text-xs text-gris">
          Fourni par le propriétaire de l&apos;atelier.
        </p>
      )}
      <input
        id="code"
        name="code"
        type="text"
        defaultValue={code ?? ""}
        autoComplete="off"
        spellCheck={false}
        autoFocus={!rejoint}
        className="mt-1.5 w-full rounded-2xl border border-bordure px-4 py-3 text-base uppercase tracking-[0.2em]"
      />
    </div>
  );
}
