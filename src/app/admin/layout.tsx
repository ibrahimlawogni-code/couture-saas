import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { administrateurConnecte } from "@/lib/admin";
import { Marque } from "../marque";

/*
 * Jamais indexee, et jamais suivie. Un arriere-guichet n'a rien a faire
 * dans un moteur de recherche, meme derriere une redirection.
 */
export const metadata: Metadata = {
  title: "Administration TailorHub",
  robots: { index: false, follow: false },
};

/*
 * La garde de toute la section.
 *
 * Elle vit dans le layout plutot que dans chaque page : une page ajoutee
 * plus tard hérite de la protection sans que personne ait a y penser.
 * C'est exactement le genre d'oubli qui ouvre une porte.
 *
 * Un compte qui n'est pas administrateur est renvoye vers son tableau de
 * bord, sans message : lui dire « reserve aux administrateurs » lui
 * apprendrait que cette adresse existe et merite d'etre essayee.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const administrateur = await administrateurConnecte();

  if (!administrateur) {
    redirect("/tableau-de-bord");
  }

  return (
    <div className="min-h-dvh bg-papier">
      <header className="border-b border-bordure bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="flex items-center gap-2.5">
            <span className="text-vert">
              <Marque taille={24} />
            </span>
            <span className="text-base font-semibold tracking-tight text-encre">
              TailorHub
            </span>
            <span className="rounded-full bg-foret px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
              Administration
            </span>
          </span>

          <span className="flex items-center gap-4 text-sm">
            <span className="hidden text-gris sm:inline">
              {administrateur.email}
            </span>
            <Link
              href="/tableau-de-bord"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-controle text-gris transition-colors hover:text-encre"
            >
              <ArrowLeft size={14} />
              Mon atelier
            </Link>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
