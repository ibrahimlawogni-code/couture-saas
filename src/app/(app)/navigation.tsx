"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS = [
  { href: "/commandes", label: "Commandes" },
  { href: "/clients", label: "Clients" },
  { href: "/finances", label: "Finances" },
];

export function NavigationPrincipale() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white">
      <ul className="mx-auto flex max-w-2xl">
        {ONGLETS.map((onglet) => {
          const actif = pathname.startsWith(onglet.href);
          return (
            <li key={onglet.href} className="flex-1">
              <Link
                href={onglet.href}
                className={`block py-4 text-center text-sm font-medium ${
                  actif ? "text-zinc-900" : "text-zinc-400"
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
