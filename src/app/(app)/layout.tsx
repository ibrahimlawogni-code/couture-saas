import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { BarreLaterale } from "./barre-laterale";
import { NavigationPrincipale } from "./navigation";
import { Prechargement } from "./prechargement";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: utilisateur } = await supabase
    .from("utilisateurs")
    .select("nom, ateliers(nom)")
    .eq("id", user.id)
    .single();

  const atelier = utilisateur?.ateliers as unknown as { nom: string } | null;
  const nomAtelier = atelier?.nom ?? "Mon atelier";
  const nomUtilisateur = utilisateur?.nom ?? "";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-papier lg:flex-row">
      <BarreLaterale
        nomAtelier={nomAtelier}
        nomUtilisateur={nomUtilisateur}
        deconnexion={signOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* En-tete du telephone seulement : sur grand ecran, la barre
            laterale porte deja le nom de l'atelier et la deconnexion. */}
        <header className="flex items-center justify-between border-b border-bordure bg-white px-4 py-4 lg:hidden">
          <Link href="/reglages" className="-m-2 rounded-2xl p-2 active:bg-papier">
            <p className="text-sm font-semibold text-encre">{nomAtelier}</p>
            <p className="text-xs text-gris">{nomUtilisateur}</p>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-2xl px-3 py-2 text-sm font-medium text-gris active:bg-papier"
            >
              Déconnexion
            </button>
          </form>
        </header>

        {/* pb-20 laisse la place a la barre du bas, inutile sur grand ecran. */}
        <main className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</main>
      </div>

      <NavigationPrincipale />
      <Prechargement />
    </div>
  );
}
