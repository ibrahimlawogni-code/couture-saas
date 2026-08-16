"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDonnees } from "@/lib/offline/use-donnees";

export function ListeClients() {
  const { clients, chargee } = useDonnees();
  const [recherche, setRecherche] = useState("");

  const resultats = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return clients;

    return clients.filter(
      (client) =>
        client.nom.toLowerCase().includes(terme) ||
        (client.telephone ?? "").includes(terme) ||
        (client.whatsapp ?? "").includes(terme)
    );
  }, [clients, recherche]);

  return (
    <>
      <input
        type="search"
        value={recherche}
        onChange={(evenement) => setRecherche(evenement.target.value)}
        placeholder="Chercher un nom ou un numéro..."
        className="mt-4 w-full rounded-2xl border border-bordure bg-white px-4 py-3 text-base"
      />

      <ul className="mt-4 flex flex-col gap-2">
        {resultats.map((client) => (
          <li key={client.id}>
            <Link
              href={`/clients/${client.id}`}
              className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-4 active:bg-papier ${
                client.enAttente || client.enEchec
                  ? "border border-dashed border-bordure bg-white"
                  : "bg-white shadow-sm"
              }`}
            >
              <span className="min-w-0 truncate text-base font-medium text-encre">
                {client.nom}
              </span>
              {client.enEchec ? (
                <span className="shrink-0 rounded-full bg-rouge-clair px-2 py-1 text-xs font-medium text-rouge">
                  Refusé
                </span>
              ) : client.enAttente ? (
                <span className="shrink-0 rounded-full bg-bleu-clair px-2 py-1 text-xs font-medium text-bleu">
                  En attente
                </span>
              ) : (
                <span className="shrink-0 text-sm text-gris">
                  {client.telephone}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {chargee && resultats.length === 0 && (
        <p className="mt-8 text-center text-sm text-gris">
          {recherche ? "Aucun client trouvé." : "Aucun client pour l'instant."}
        </p>
      )}
    </>
  );
}
