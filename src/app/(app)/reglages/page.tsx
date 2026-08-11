import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAtelierId } from "@/lib/atelier";
import { FormulaireReglages } from "./formulaire";

export default async function ReglagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const atelierId = await getAtelierId();

  if (!user || !atelierId) {
    redirect("/login");
  }

  const [{ data: atelier }, { data: profil }] = await Promise.all([
    supabase.from("ateliers").select("nom").eq("id", atelierId).single(),
    supabase.from("utilisateurs").select("nom, role").eq("id", user.id).single(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href="/commandes" className="text-sm text-gris">
        &larr; Retour
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-encre">Réglages</h1>

      <FormulaireReglages
        atelierId={atelierId}
        utilisateurId={user.id}
        nomAtelier={atelier?.nom ?? ""}
        nomUtilisateur={profil?.nom ?? ""}
      />

      <section className="mt-10 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gris">
          Compte
        </h2>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-gris">Email</span>
          <span className="font-medium text-encre">{user.email}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-gris">Rôle</span>
          <span className="font-medium text-encre">{profil?.role ?? "tailleur"}</span>
        </div>
      </section>
    </div>
  );
}
