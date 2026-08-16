"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { retirerDeLaFile } from "@/lib/offline/outbox";

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
    return (
      <div className="fixed inset-x-0 top-0 z-50 rounded-b-2xl bg-rouge text-white shadow-lg">
        <button
          type="button"
          onClick={() => setDeplie(!deplie)}
          className="w-full px-4 py-2 text-center text-sm font-medium"
        >
          {echecs.length} enregistrement{echecs.length > 1 ? "s" : ""} refusé
          {echecs.length > 1 ? "s" : ""} · {deplie ? "masquer" : "voir"}
        </button>

        {deplie && (
          <ul className="flex flex-col gap-2 px-4 pb-3">
            {echecs.map((operation) => (
              <li
                key={operation.id}
                className="flex items-start justify-between gap-3 rounded-2xl bg-white/15 px-3 py-2 text-left text-sm"
              >
                <span className="min-w-0">
                  {String(operation.donnees.nom ?? operation.donnees.nom_modele ?? "Saisie")}
                  <span className="block text-xs text-white/80">
                    {operation.motif ?? "Refusé par le serveur."}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => retirerDeLaFile(operation.id)}
                  className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-medium"
                >
                  Retirer
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
      <p className="fixed inset-x-0 top-0 z-50 bg-bleu py-2 text-center text-sm font-medium text-white">
        Hors connexion
        {enAttente.length > 0 && ` · ${enAttente.length} en attente d'envoi`}
      </p>
    );
  }

  if (enAttente.length > 0) {
    return (
      <p className="fixed inset-x-0 top-0 z-50 bg-bleu py-2 text-center text-sm font-medium text-white">
        Envoi en cours · {enAttente.length} restant
        {enAttente.length > 1 ? "s" : ""}
      </p>
    );
  }

  return null;
}
