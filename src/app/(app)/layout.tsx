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
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {atelier?.nom ?? "Mon atelier"}
          </p>
          <p className="text-xs text-zinc-500">{utilisateur?.nom}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 active:bg-zinc-100"
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
