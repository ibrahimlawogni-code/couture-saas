"use client";

import { useState } from "react";
import { GOOGLE_ACTIF } from "@/lib/fournisseurs";
import { traduire, type Langue } from "@/lib/i18n";
import { BoutonGoogle, Separateur } from "../bouton-google";
import { ChampCode } from "./champ-code";
import { ChampMotDePasse } from "../champ-mot-de-passe";
import { signup } from "./actions";

/*
 * Creer un atelier et en rejoindre un sont deux parcours dans un seul
 * formulaire, et c'est le code d'invitation qui les separe.
 *
 * Le cas du code recu par lien etait deja traite, sur le serveur. Restait
 * celui du code tape a la main : son etat vivait dans le champ, sans
 * remonter, si bien que la page continuait d'annoncer « Créer votre
 * atelier », de demander un nom d'atelier et de l'exiger - alors que le
 * declencheur de la base ignore ce nom des qu'un code est fourni
 * (migration 0007). L'apprenti devait inventer un nom voue a etre jete.
 *
 * L'etat est donc tenu ici, au-dessus des deux champs qu'il gouverne.
 */
export function FormulaireInscription({
  code,
  erreur,
  langue,
}: {
  code?: string;
  erreur?: string;
  /*
   * Le code de langue, et non le dictionnaire : il vient d'un ecran rendu
   * par le serveur, et les fonctions d'accord du dictionnaire ne franchissent
   * pas cette frontiere. Il sort du cookie du visiteur, puisqu'avant
   * l'inscription il n'y a pas encore d'atelier dont lire la langue.
   */
  langue: Langue;
}) {
  const mots = traduire(langue);
  const impose = Boolean(code);
  const [saisi, setSaisi] = useState(code ?? "");
  const [ouvert, setOuvert] = useState(impose);

  // Un champ ouvert mais vide ne rejoint rien : c'est le code qui compte,
  // pas le fait d'avoir deplie la section.
  const rejoint = saisi.trim().length > 0;

  return (
    <>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-encre">
        {rejoint
          ? mots.acces.rejoindreAtelier
          : mots.acces.creerVotreAtelier}
      </h1>
      <p className="mt-1.5 text-sm text-gris">
        {rejoint
          ? mots.acces.sousTitreInvite
          : mots.acces.sousTitreCreation}
      </p>

      {erreur && (
        <p role="alert" className="mt-6 rounded-carte bg-rouge-clair px-4 py-3 text-sm text-rouge">
          {erreur}
        </p>
      )}

      {/*
       * Google evite l'email de confirmation, qui est l'etape ou une
       * inscription se perd le plus souvent ici. Le code d'invitation en
       * cours de saisie part avec le bouton : sans lui, l'apprenti
       * reviendrait de Google sans rien qui le rattache a son atelier.
       */}
      {GOOGLE_ACTIF && (
        <div className="mt-5 flex flex-col gap-4">
          <BoutonGoogle langue={langue} code={saisi.trim()} />
          <Separateur langue={langue} />
        </div>
      )}

      <form
        action={signup}
        className={`flex flex-col gap-3 ${GOOGLE_ACTIF ? "mt-4" : "mt-5"}`}
      >
        {!rejoint && (
          <Champ
            id="atelier"
            label={mots.acces.nomAtelier}
            type="text"
            autoComplete="organization"
          />
        )}
        <Champ
          id="nom"
          label={mots.acces.votreNom}
          type="text"
          autoComplete="name"
        />
        <Champ
          id="email"
          label={mots.acces.email}
          type="email"
          autoComplete="email"
        />

        <ChampMotDePasse langue={langue} />

        <ChampCode
          langue={langue}
          valeur={saisi}
          surSaisie={setSaisi}
          ouvert={ouvert}
          surOuverture={() => setOuvert(true)}
          impose={impose}
        />

        <button
          type="submit"
          className="mt-2 min-h-12 rounded-controle bg-vert px-4 text-base font-medium text-white transition-colors duration-150 ease-doux hover:bg-foret active:translate-y-px"
        >
          {rejoint
            ? mots.acces.rejoindreAtelier
            : mots.acces.creerMonAtelier}
        </button>
      </form>
    </>
  );
}

function Champ({
  id,
  label,
  type,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-encre">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required
        className="mt-1.5 min-h-11 w-full rounded-controle border border-bordure px-4 py-3 text-base transition-colors duration-150 ease-doux hover:border-vert-pale"
      />
    </div>
  );
}
