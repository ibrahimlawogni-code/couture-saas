"use client";

import { useFileAttente } from "@/lib/offline/use-file-attente";

/**
 * Les clients pas encore synchronises n'existent pas cote serveur : sans
 * cet affichage, l'utilisateur croirait sa saisie perdue.
 */
export function ClientsEnAttente() {
  const { enAttente, echecs } = useFileAttente();

  const clients = [...enAttente, ...echecs].filter(
    (operation) => operation.table === "clients"
  );

  if (clients.length === 0) return null;

  return (
    <ul className="mt-2 flex flex-col gap-2">
      {clients.map((operation) => (
        <li
          key={operation.id}
          className="flex items-center justify-between rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-4"
        >
          <span className="text-base font-medium text-zinc-900">
            {String(operation.donnees.nom ?? "Sans nom")}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
              operation.echec
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {operation.echec ? "Echec d'envoi" : "En attente"}
          </span>
        </li>
      ))}
    </ul>
  );
}
