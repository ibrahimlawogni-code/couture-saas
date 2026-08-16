"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRight, SignOut } from "@phosphor-icons/react/dist/ssr";
import { Marque } from "../marque";
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
    // sur-fond-sombre bascule l'anneau de focus en blanc : le vert de
    // l'anneau par defaut se perd dans le vert forêt du fond.
    <aside className="sur-fond-sombre hidden w-64 shrink-0 flex-col bg-foret p-4 text-white lg:flex">
      <Link
        href="/tableau-de-bord"
        className="flex items-center gap-2.5 rounded-controle px-2 py-1.5"
      >
        <Marque taille={26} />
        <span className="text-lg font-semibold tracking-tight">TailorHub</span>
      </Link>

      {/*
       * L'atelier est un raccourci vers les reglages, mais rien ne le
       * disait : ni fleche, ni changement au survol. Il ressemblait a une
       * simple etiquette, et l'ecran Reglages restait introuvable sur
       * grand ecran ou aucun onglet ne le porte.
       */}
      <Link
        href="/reglages"
        aria-current={pathname.startsWith("/reglages") ? "page" : undefined}
        className={`mt-6 flex items-center gap-2 rounded-carte px-3 py-3 transition-colors duration-150 ease-doux ${
          pathname.startsWith("/reglages")
            ? "bg-white/15"
            : "bg-white/[0.07] hover:bg-white/15"
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{nomAtelier}</span>
          <span className="block truncate text-xs text-vert-pale">
            {nomUtilisateur || "Réglages"}
          </span>
        </span>
        <CaretRight size={14} weight="bold" className="shrink-0 text-vert-pale" />
      </Link>

      <nav aria-label="Navigation principale" className="mt-6 flex flex-col gap-0.5">
        {ONGLETS.map(({ href, label, icone: Icone }) => {
          const actif = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={`flex items-center gap-3 rounded-controle px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-doux ${
                actif
                  ? "bg-white text-foret"
                  : "text-vert-pale hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icone size={19} weight={actif ? "fill" : "regular"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={deconnexion} className="mt-auto pt-4">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-controle px-3 py-2.5 text-left text-sm font-medium text-vert-pale transition-colors duration-150 ease-doux hover:bg-white/10 hover:text-white"
        >
          <SignOut size={19} />
          Déconnexion
        </button>
      </form>
    </aside>
  );
}
