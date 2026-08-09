"use client";

import { useEffect, useState } from "react";

export function ServiceWorker() {
  const [horsLigne, setHorsLigne] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Un echec d'enregistrement ne doit pas casser l'application.
      });
    }

    const majEtat = () => setHorsLigne(!navigator.onLine);
    majEtat();

    window.addEventListener("online", majEtat);
    window.addEventListener("offline", majEtat);
    return () => {
      window.removeEventListener("online", majEtat);
      window.removeEventListener("offline", majEtat);
    };
  }, []);

  if (!horsLigne) return null;

  return (
    <p className="fixed inset-x-0 top-0 z-50 bg-amber-500 py-2 text-center text-sm font-medium text-white">
      Hors connexion
    </p>
  );
}
