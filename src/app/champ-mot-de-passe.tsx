"use client";

import { useState } from "react";
import { Eye, EyeSlash, LockSimple } from "@phosphor-icons/react/dist/ssr";

export const REGLES = [
  { libelle: "Au moins 8 caractères", teste: (v: string) => v.length >= 8 },
  { libelle: "Une lettre", teste: (v: string) => /\p{L}/u.test(v) },
  { libelle: "Un chiffre", teste: (v: string) => /\d/.test(v) },
];

export function motDePasseValide(valeur: string) {
  return REGLES.every((regle) => regle.teste(valeur));
}

/**
 * Un mot de passe qu'on ne peut pas relire se tape mal, surtout sur un
 * clavier de telephone. L'oeil le rend visible, et les criteres s'affichent
 * pendant la saisie plutot qu'apres un refus.
 */
export function ChampMotDePasse({
  nom = "password",
  libelle = "Mot de passe",
  autoComplete = "new-password",
  criteres = true,
  surFondSombre = false,
}: {
  nom?: string;
  libelle?: string;
  autoComplete?: string;
  criteres?: boolean;
  surFondSombre?: boolean;
}) {
  const [valeur, setValeur] = useState("");
  const [visible, setVisible] = useState(false);

  const Icone = visible ? EyeSlash : Eye;

  if (surFondSombre) {
    return (
      <div>
        <label htmlFor={nom} className="sr-only">
          {libelle}
        </label>
        <div className="flex items-center gap-3 border-b border-white/25 pb-2 focus-within:border-white">
          <LockSimple size={20} weight="light" className="text-vert-pale" />
          <input
            id={nom}
            name={nom}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            required
            placeholder={libelle}
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-base text-white placeholder:text-vert-pale focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="shrink-0 text-vert-pale hover:text-white"
          >
            <Icone size={20} weight="light" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={nom} className="block text-sm font-medium text-encre">
        {libelle}
      </label>
      <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-bordure bg-white px-4 focus-within:border-vert">
        <input
          id={nom}
          name={nom}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          {...(criteres
            ? { minLength: 8, pattern: "(?=.*[A-Za-zÀ-ÿ])(?=.*[0-9]).{8,}" }
            : {})}
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          className="w-full border-0 bg-transparent py-3 text-base text-encre focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="shrink-0 text-gris hover:text-encre"
        >
          <Icone size={20} weight="light" />
        </button>
      </div>

      {criteres && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {REGLES.map((regle) => {
            const ok = regle.teste(valeur);
            return (
              <li
                key={regle.libelle}
                className={`flex items-center gap-1.5 text-xs ${
                  ok ? "text-vert" : "text-gris"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    ok ? "bg-vert" : "bg-bordure"
                  }`}
                />
                {regle.libelle}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
