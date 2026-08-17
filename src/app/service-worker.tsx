"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CaretDown,
  CloudSlash,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { retirerDeLaFile } from "@/lib/offline/outbox";

/*
 * La bande d'etat du reseau, tout en haut de l'application.
 *
 * Elle etait en position fixe, et recouvrait donc l'en-tete du telephone :
 * passer hors ligne faisait disparaitre le nom de l'atelier et le bouton
 * de deconnexion sous la bande bleue. Elle est maintenant dans le flux, ou
 * elle decale le contenu au lieu de le masquer, et collante pour rester
 * visible pendant le defilement.
 *
 * Le bleu la designe comme une parole du systeme, jamais du metier. Le
 * rouge est reserve au seul cas qui demande une decision : un refus
 * definitif, que l'attente ne resoudra pas.
 */
export function BarreEtatReseau() {
  const router = useRouter();
  const { horsLigne, enAttente, echecs } = useFileAttente();
  const [deplie, setDeplie] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Un echec d'enregistrement ne doit pas casser l'application.
    });
  }, []);

  // La file qui se vide signifie que le serveur a de nouvelles donnees.
  useEffect(() => {
    if (!horsLigne && enAttente.length === 0) router.refresh();
  }, [horsLigne, enAttente.length, router]);

  /*
   * Un refus definitif ne se resoudra pas en attendant : il faut dire
   * pourquoi, et laisser la personne s'en debarrasser. Sans ce bouton, une
   * saisie refusee resterait affichee indefiniment comme si elle allait
   * partir un jour.
   */
  if (echecs.length > 0) {
    const pluriel = echecs.length > 1 ? "s" : "";

    return (
      <div
        role="alert"
        className="sur-fond-sombre sticky top-0 z-50 bg-rouge pt-securite text-white shadow-flottant"
      >
        <button
          type="button"
          onClick={() => setDeplie(!deplie)}
          aria-expanded={deplie}
          className="flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm font-medium"
        >
          <WarningCircle size={17} weight="fill" className="shrink-0" />
          <span>
            {echecs.length} enregistrement{pluriel} refusé{pluriel}
          </span>
          <CaretDown
            size={13}
            weight="bold"
            className={`shrink-0 transition-transform duration-200 ease-doux ${
              deplie ? "rotate-180" : ""
            }`}
          />
        </button>

        {deplie && (
          <ul className="flex flex-col gap-1.5 px-3 pb-3">
            {echecs.map((operation) => (
              <li
                key={operation.id}
                className="flex items-start justify-between gap-3 rounded-carte bg-white/15 py-2.5 pr-2 pl-3 text-left text-sm"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {String(
                      operation.donnees.nom ??
                        operation.donnees.nom_modele ??
                        "Saisie"
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-white/85">
                    {operation.motif ?? "Refusé par le serveur."}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => retirerDeLaFile(operation.id)}
                  aria-label="Retirer cette saisie de la file"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/35"
                >
                  <X size={14} weight="bold" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (horsLigne) {
    return (
      <BandeSysteme icone={CloudSlash}>
        Hors connexion
        {enAttente.length > 0 && ` · ${enAttente.length} en attente d'envoi`}
      </BandeSysteme>
    );
  }

  if (enAttente.length > 0) {
    return (
      <BandeSysteme icone={UploadSimple} anime>
        Envoi en cours · {enAttente.length} restant
        {enAttente.length > 1 ? "s" : ""}
      </BandeSysteme>
    );
  }

  return null;
}

function BandeSysteme({
  icone: Icone,
  anime = false,
  children,
}: {
  icone: React.ComponentType<{ size?: number; className?: string }>;
  anime?: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      role="status"
      /*
       * Le calcul plutot que py-2 et pt-securite cote a cote : les deux
       * posent padding-top, et l'utilitaire emis en dernier l'emporte.
       * pt-securite gagnait donc, et vaut zero partout sauf sur un
       * appareil a encoche installe en PWA - le texte se retrouvait colle
       * au bord haut sur tous les autres.
       */
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-bleu px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 text-sm font-medium text-white"
    >
      <Icone size={16} className={anime ? "animate-pulse" : undefined} />
      {children}
    </p>
  );
}
