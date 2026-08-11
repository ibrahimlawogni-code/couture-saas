import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-papier">
      <header className="flex items-center justify-between border-b border-bordure bg-white px-4 py-4">
        {/* Le nom de l'atelier mene aux reglages : c'est la qu'on cherche
            naturellement a le modifier, et la barre du bas reste degagee. */}
        <Link href="/reglages" className="-m-2 rounded-2xl p-2 active:bg-papier">
          <p className="text-sm font-semibold text-encre">
            {atelier?.nom ?? "Mon atelier"}
          </p>
          <p className="text-xs text-gris">{utilisateur?.nom}</p>
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

      {/* pb-20 laisse la place a la barre de navigation fixe */}
      <main className="flex flex-1 flex-col pb-20">{children}</main>

      <NavigationPrincipale />
      <Prechargement />
    </div>
  );
}
