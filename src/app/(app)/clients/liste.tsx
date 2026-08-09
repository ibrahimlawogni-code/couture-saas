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
        placeholder="Chercher un nom ou un numero..."
        className="mt-4 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base"
      />

      <ul className="mt-4 flex flex-col gap-2">
        {resultats.map((client) => (
          <li key={client.id}>
            <Link
              href={`/clients/${client.id}`}
              className={`flex items-center justify-between gap-3 rounded-xl px-4 py-4 active:bg-zinc-100 ${
                client.enAttente
                  ? "border border-dashed border-zinc-300 bg-white"
                  : "bg-white shadow-sm"
              }`}
            >
              <span className="min-w-0 truncate text-base font-medium text-zinc-900">
                {client.nom}
              </span>
              {client.enAttente ? (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  En attente
                </span>
              ) : (
                <span className="shrink-0 text-sm text-zinc-500">
                  {client.telephone}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {chargee && resultats.length === 0 && (
        <p className="mt-8 text-center text-sm text-zinc-500">
          {recherche ? "Aucun client trouve." : "Aucun client pour l'instant."}
        </p>
      )}
    </>
  );
}
