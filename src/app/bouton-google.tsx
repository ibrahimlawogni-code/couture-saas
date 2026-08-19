"use client";

import { useState } from "react";
import { GoogleLogo } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { deposerCode } from "@/lib/code-invitation";

/*
 * « Continuer avec Google », sur les deux ecrans d'acces.
 *
 * Le gain n'est pas d'epargner un mot de passe : c'est de supprimer l'email
 * de confirmation. Google a deja verifie l'adresse, la personne revient avec
 * une session ouverte. Plus de lien a retrouver dans une boite mail sur un
 * telephone d'entree de gamme, plus de lien expire, et plus d'atelier a
 * activer a la main - ce que messages-auth.ts proposait deux fois faute de
 * mieux.
 *
 * Le mot de passe reste a cote, volontairement : un telephone partage ou un
 * compte Google perdu ne doit pas fermer la porte de l'atelier.
 */
export function BoutonGoogle({
  code,
  surFondSombre = false,
}: {
  /** Code d'invitation en cours de saisie, a reporter apres le detour. */
  code?: string;
  surFondSombre?: boolean;
}) {
  const [occupe, setOccupe] = useState(false);
  const [echec, setEchec] = useState(false);

  async function continuer() {
    setOccupe(true);
    setEchec(false);

    if (code) deposerCode(code);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      // Le meme point d'arrivee que les liens envoyes par email : il sait
      // deja echanger le code contre une session.
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

    /*
     * Sans erreur, le navigateur est deja parti chez Google et ce composant
     * n'existe plus : on ne remet le bouton au repos que si l'appel a
     * echoue, sinon il clignoterait pendant la redirection.
     */
    if (error) {
      setEchec(true);
      setOccupe(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={continuer}
        disabled={occupe}
        className={`flex min-h-12 items-center justify-center gap-2.5 rounded-controle px-4 text-base font-medium transition-colors duration-150 ease-doux active:translate-y-px disabled:opacity-70 ${
          surFondSombre
            ? "border border-white/25 text-white hover:bg-white/10"
            : "border border-bordure bg-white text-encre hover:bg-papier"
        }`}
      >
        <GoogleLogo size={19} weight="bold" aria-hidden />
        {occupe ? "Ouverture..." : "Continuer avec Google"}
      </button>

      {echec && (
        <p
          role="alert"
          className={`text-xs ${surFondSombre ? "text-ambre-clair" : "text-rouge"}`}
        >
          La connexion avec Google n&apos;a pas pu s&apos;ouvrir. Réessayez, ou
          utilisez votre email et votre mot de passe.
        </p>
      )}
    </div>
  );
}

/** Filet « ou » entre le bouton du fournisseur et le formulaire. */
export function Separateur({ surFondSombre = false }: { surFondSombre?: boolean }) {
  const trait = surFondSombre ? "bg-white/20" : "bg-bordure";
  const texte = surFondSombre ? "text-vert-pale" : "text-gris";

  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className={`h-px flex-1 ${trait}`} />
      <span className={`text-xs ${texte}`}>ou</span>
      <span className={`h-px flex-1 ${trait}`} />
    </div>
  );
}
