import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAtelierId } from "@/lib/atelier";
import { Equipe, type Invitation, type Membre } from "./equipe";
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

  const [{ data: atelier }, { data: membres }, { data: invitations }] =
    await Promise.all([
      supabase
        .from("ateliers")
        .select("nom, limite_utilisateurs")
        .eq("id", atelierId)
        .single(),
      supabase.from("utilisateurs").select("id, nom, role").order("role"),
      supabase
        .from("invitations")
        .select("id, code, expire_le")
        .is("utilisee_le", null)
        .gt("expire_le", new Date().toISOString())
        .order("created_at"),
    ]);

  const moi = (membres ?? []).find((membre) => membre.id === user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href="/tableau-de-bord" className="text-sm text-gris">
        &larr; Retour
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-encre">Réglages</h1>

      <FormulaireReglages
        atelierId={atelierId}
        utilisateurId={user.id}
        nomAtelier={atelier?.nom ?? ""}
        nomUtilisateur={moi?.nom ?? ""}
      />

      <Equipe
        atelierId={atelierId}
        utilisateurId={user.id}
        estProprietaire={moi?.role === "proprietaire"}
        membres={(membres ?? []) as Membre[]}
        invitations={(invitations ?? []) as Invitation[]}
        places={atelier?.limite_utilisateurs ?? 6}
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
          <span className="text-gris">Mot de passe</span>
          <Link href="/nouveau-mot-de-passe" className="font-medium text-vert underline">
            Modifier
          </Link>
        </div>
      </section>
    </div>
  );
}
