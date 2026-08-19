"use client";

import { useState, useSyncExternalStore } from "react";
import { ChampCode } from "../signup/champ-code";
import { reprendreCode } from "@/lib/code-invitation";
import { terminerInscription } from "./actions";

const sansAbonnement = () => () => {};

/*
 * Dernier pas d'une inscription par fournisseur externe.
 *
 * Meme partage que le formulaire d'inscription : avec un code on rejoint un
 * atelier, sans code on en ouvre un. Le titre, le bouton et la presence du
 * champ « Nom de l'atelier » suivent le code, qui est donc tenu ici.
 */
export function FormulaireBienvenue({
  nomPropose,
  erreur,
}: {
  /** Nom transmis par le fournisseur, que la personne peut corriger. */
  nomPropose: string;
  erreur?: string;
}) {
  /*
   * Le code depose avant le depart chez Google.
   *
   * Lu par useSyncExternalStore et non dans un effet : sessionStorage
   * n'existe pas au rendu serveur, et l'instantane serveur separe donne au
   * premier rendu la meme valeur des deux cotes, sans desaccord
   * d'hydratation. C'est deja l'idiome de useHydratation dans ce depot.
   */
  const reporte = useSyncExternalStore(sansAbonnement, reprendreCode, () => "");

  /*
   * Etat derive plutot que recopie : le code reporte sert de valeur tant
   * que personne n'a touche au champ, la saisie prend la main ensuite.
   * Recopier le report dans un etat aurait demande de le faire depuis un
   * effet, ce qui fait renoncer le compilateur React a memoiser l'ecran.
   */
  const [modifie, setModifie] = useState<string | null>(null);
  const [deplie, setDeplie] = useState(false);

  const saisi = modifie ?? reporte;
  const ouvert = deplie || saisi.length > 0;

  const rejoint = saisi.trim().length > 0;

  return (
    <>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-encre">
        {rejoint ? "Rejoindre l'atelier" : "Nommez votre atelier"}
      </h1>
      <p className="mt-1.5 text-sm text-gris">
        {rejoint
          ? "Votre compte est prêt, il ne reste qu'à vous rattacher"
          : "Votre compte est prêt. Encore une chose et c'est parti"}
      </p>

      {erreur && (
        <p
          role="alert"
          className="mt-6 rounded-carte bg-rouge-clair px-4 py-3 text-sm text-rouge"
        >
          {erreur}
        </p>
      )}

      <form action={terminerInscription} className="mt-5 flex flex-col gap-3">
        {!rejoint && (
          <div>
            <label
              htmlFor="atelier"
              className="block text-sm font-medium text-encre"
            >
              Nom de l&apos;atelier
            </label>
            <p className="mt-1 text-xs text-gris">
              Il apparaîtra sur les reçus remis à vos clients.
            </p>
            <input
              id="atelier"
              name="atelier"
              type="text"
              autoComplete="organization"
              required
              autoFocus
              className="mt-1.5 min-h-11 w-full rounded-controle border border-bordure px-4 py-3 text-base transition-colors duration-150 ease-doux hover:border-vert-pale"
            />
          </div>
        )}

        <div>
          <label htmlFor="nom" className="block text-sm font-medium text-encre">
            Votre nom
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            autoComplete="name"
            defaultValue={nomPropose}
            required
            className="mt-1.5 min-h-11 w-full rounded-controle border border-bordure px-4 py-3 text-base transition-colors duration-150 ease-doux hover:border-vert-pale"
          />
        </div>

        <ChampCode
          valeur={saisi}
          surSaisie={setModifie}
          ouvert={ouvert}
          surOuverture={() => setDeplie(true)}
          impose={false}
        />

        <button
          type="submit"
          className="mt-2 min-h-12 rounded-controle bg-vert px-4 text-base font-medium text-white transition-colors duration-150 ease-doux hover:bg-foret active:translate-y-px"
        >
          {rejoint ? "Rejoindre l'atelier" : "Ouvrir mon atelier"}
        </button>
      </form>
    </>
  );
}
