"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFileAttente } from "@/lib/offline/use-file-attente";

export function BarreEtatReseau() {
  const router = useRouter();
  const { horsLigne, enAttente, echecs } = useFileAttente();

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

  if (echecs.length > 0) {
    return (
      <p className="fixed inset-x-0 top-0 z-50 bg-rouge py-2 text-center text-sm font-medium text-white">
        {echecs.length} enregistrement{echecs.length > 1 ? "s" : ""} n&apos;
        {echecs.length > 1 ? "ont" : "a"} pas pu etre envoye
        {echecs.length > 1 ? "s" : ""}
      </p>
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
