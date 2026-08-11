"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ONGLETS } from "./onglets";

/** Barre du bas, atteignable au pouce. Remplacee par la barre laterale
 *  au-dela de 1024 px. */
export function NavigationPrincipale() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-bordure bg-white lg:hidden">
      <ul className="mx-auto flex max-w-2xl">
        {ONGLETS.map((onglet) => {
          const actif = pathname.startsWith(onglet.href);
          return (
            <li key={onglet.href} className="flex-1">
              <Link
                href={onglet.href}
                className={`block py-4 text-center text-sm font-medium ${
                  actif ? "text-encre" : "text-gris"
                }`}
              >
                {onglet.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
