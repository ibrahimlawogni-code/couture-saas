"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ONGLETS } from "./onglets";

/**
 * Navigation de grand ecran. Le telephone garde sa barre du bas : une
 * colonne laterale y mangerait un tiers de la largeur utile.
 */
export function BarreLaterale({
  nomAtelier,
  nomUtilisateur,
  deconnexion,
}: {
  nomAtelier: string;
  nomUtilisateur: string;
  deconnexion: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-foret p-5 text-white lg:flex">
      <span className="px-2 text-lg font-semibold tracking-tight">TailorHub</span>

      <Link
        href="/reglages"
        className="mt-6 rounded-2xl bg-white/10 px-4 py-3 transition-colors hover:bg-white/15"
      >
        <p className="truncate text-sm font-semibold">{nomAtelier}</p>
        <p className="truncate text-xs text-vert-pale">{nomUtilisateur}</p>
      </Link>

      <nav className="mt-6 flex flex-col gap-1">
        {ONGLETS.map((onglet) => {
          const actif = pathname.startsWith(onglet.href);
          return (
            <Link
              key={onglet.href}
              href={onglet.href}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                actif ? "bg-white text-foret" : "text-vert-pale hover:bg-white/10"
              }`}
            >
              {onglet.label}
            </Link>
          );
        })}
      </nav>

      <form action={deconnexion} className="mt-auto">
        <button
          type="submit"
          className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-vert-pale transition-colors hover:bg-white/10"
        >
          Déconnexion
        </button>
      </form>
    </aside>
  );
}
