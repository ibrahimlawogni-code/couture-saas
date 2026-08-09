"use client";

import { formaterMontant } from "@/lib/commandes";
import { useFileAttente } from "@/lib/offline/use-file-attente";

/**
 * Les commandes pas encore synchronisees n'existent pas cote serveur.
 * Elles apparaissent en tete de la colonne "Recu", en pointilles.
 */
export function CommandesEnAttente() {
  const { enAttente, echecs } = useFileAttente();

  const commandes = [...enAttente, ...echecs].filter(
    (operation) => operation.table === "commandes"
  );

  if (commandes.length === 0) return null;

  return (
    <ul className="mb-2 flex flex-col gap-2">
      {commandes.map((operation) => (
        <li
          key={operation.id}
          className="rounded-xl border border-dashed border-zinc-300 bg-white p-3"
        >
          <p className="text-sm font-medium text-zinc-900">
            {String(operation.donnees.nom_modele ?? "Sans modele")}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                operation.echec
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {operation.echec ? "Echec d'envoi" : "En attente"}
            </span>
            <span className="text-xs text-zinc-500">
              {formaterMontant(Number(operation.donnees.prix_total ?? 0))}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
