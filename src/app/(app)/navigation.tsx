"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTraductions } from "@/lib/offline/use-traductions";
import { ONGLETS } from "./onglets";

/**
 * Barre du bas, atteignable au pouce. Remplacee par la barre laterale
 * au-dela de 1024 px.
 */
export function NavigationPrincipale() {
  const pathname = usePathname();
  const mots = useTraductions();

  return (
    <nav
      aria-label={mots.navigationPrincipale}
      /*
       * pb-securite reserve la hauteur de l'indicateur d'accueil de
       * l'iPhone. Sans elle, une fois l'application installee en PWA, le
       * trait blanc du systeme se pose sur les onglets et les rend
       * difficiles a viser.
       */
      className="fixed inset-x-0 bottom-0 z-40 border-t border-bordure bg-white/95 pb-securite backdrop-blur-sm lg:hidden"
    >
      <ul className="mx-auto flex max-w-2xl">
        {ONGLETS.map(({ href, cle, icone: Icone }) => {
          const actif = pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                className="group relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2"
              >
                {/*
                 * Trait au-dessus de l'onglet actif. La couleur seule ne
                 * suffit pas a designer l'onglet courant : elle echappe a
                 * une partie des daltonismes, et se voit mal en plein
                 * soleil sur un ecran de telephone.
                 */}
                <span
                  aria-hidden
                  className={`absolute inset-x-4 top-0 h-0.5 rounded-full transition-colors duration-150 ease-doux ${
                    actif ? "bg-foret" : "bg-transparent"
                  }`}
                />

                <Icone
                  size={22}
                  weight={actif ? "fill" : "regular"}
                  className={
                    actif
                      ? "text-foret"
                      : "text-gris transition-colors group-active:text-encre"
                  }
                />
                <span
                  className={`text-[11px] leading-none font-medium ${
                    actif ? "text-foret" : "text-gris"
                  }`}
                >
                  {mots.onglets[cle]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
