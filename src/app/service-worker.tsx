"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CaretDown,
  CheckCircle,
  CloudSlash,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { useEtatEnvoi } from "@/lib/offline/use-etat-envoi";
import { retirerDeLaFile } from "@/lib/offline/outbox";

/**
 * Enregistrement du service worker, et relecture quand le reseau revient.
 *
 * Separe de la bande d'etat parce que les deux n'ont pas la meme portee :
 * l'enregistrement vaut pour tout le site, y compris la page de vente d'ou
 * se fait l'installation, tandis que la bande ne concerne que
 * l'application. Tant que les deux tenaient dans un seul composant, rendre
 * la bande permanente aurait pose « À jour » en tete de la page de vente.
 */
export function EnregistrerServiceWorker() {
  const router = useRouter();
  const { horsLigne, enAttente } = useFileAttente();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Un echec d'enregistrement ne doit pas casser l'application.
    });
  }, []);

  /*
   * La file qui se vide signifie que le serveur a de nouvelles donnees.
   *
   * Mais seulement si quelque chose a change. Cet effet se declenchait a
   * chaque montage, et le premier rendu annonce toujours « en ligne » :
   * le store ne consulte navigator.onLine que dans l'effet d'abonnement,
   * donc apres. Hors reseau, ce rafraichissement echouait, Next basculait
   * en navigation dure - location.replace - et la page se rechargeait
   * depuis le cache pour recommencer aussitot. React n'atteignait jamais
   * la fin de son hydratation : les formulaires restaient figes sur
   * « Chargement... » et la navigation arriere ne permettait pas d'en
   * sortir, replace n'empilant rien.
   */
  const precedent = useRef<{ horsLigne: boolean; enAttente: number } | null>(null);

  useEffect(() => {
    const avant = precedent.current;
    precedent.current = { horsLigne, enAttente: enAttente.length };

    // Premier passage : rien n'a encore change, il n'y a rien a relire.
    if (!avant) return;

    const reseauRevenu = avant.horsLigne && !horsLigne;
    const fileVidee = avant.enAttente > 0 && enAttente.length === 0;

    if (!horsLigne && (reseauRevenu || fileVidee)) router.refresh();
  }, [horsLigne, enAttente.length, router]);

  return null;
}

/*
 * La bande d'etat du reseau, sous l'en-tete de l'application.
 *
 * Elle ne parlait qu'en cas d'ennui : hors ligne, envoi en cours, refus.
 * Le reste du temps elle disparaissait, et son absence ne disait rien -
 * ni « tout est parti », ni « je n'ai pas encore verifie ». Pour qui perd
 * le reseau plusieurs fois par jour, c'est justement l'etat calme qui a
 * besoin d'etre dit : il rassure sur ce qui vient d'etre enregistre.
 *
 * Elle est donc permanente, et tient en 26 px tant que rien ne va mal.
 * Elle informe, elle ne bloque pas.
 *
 * Le bleu la designe comme une parole du systeme, jamais du metier. Le
 * rouge est reserve au seul cas qui demande une decision : un refus
 * definitif, que l'attente ne resoudra pas.
 */
export function BarreEtatReseau() {
  const { echecs } = useFileAttente();
  const etat = useEtatEnvoi();
  const [deplie, setDeplie] = useState(false);

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
        className="sur-fond-sombre sticky top-0 z-40 bg-rouge text-white shadow-flottant"
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

  const calme = etat.ton === "calme";
  const enCours = etat.texte === "Envoi en cours";
  const Icone = calme ? CheckCircle : enCours ? UploadSimple : CloudSlash;

  /*
   * L'etat calme s'efface sur grand ecran : la barre laterale y porte deja
   * l'etat d'envoi en permanence, et deux endroits qui disent la meme chose
   * finissent toujours par se contredire. Les etats qui demandent
   * l'attention restent visibles partout.
   */
  return (
    <Bande
      ton={calme ? "calme" : "systeme"}
      icone={Icone}
      anime={enCours}
      classe={calme ? "lg:hidden" : undefined}
    >
      {etat.texte}
      {etat.detail ? ` · ${etat.detail}` : ""}
    </Bande>
  );
}

const TONS_BANDE = {
  systeme: "bg-bleu-clair text-bleu",
  calme: "bg-papier text-gris",
} as const;

function Bande({
  ton,
  icone: Icone,
  anime = false,
  classe,
  children,
}: {
  ton: keyof typeof TONS_BANDE;
  icone: React.ComponentType<{ size?: number; className?: string }>;
  anime?: boolean;
  classe?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      role="status"
      className={`sticky top-0 z-40 flex h-[1.625rem] items-center gap-2 border-b border-bordure px-4 text-[0.6875rem] font-medium ${TONS_BANDE[ton]} ${classe ?? ""}`}
    >
      <Icone size={13} className={anime ? "animate-pulse" : undefined} />
      {children}
    </p>
  );
}
