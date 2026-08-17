import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAtelierId } from "@/lib/atelier";
import { Carte } from "@/ui/carte";
import { EnTetePage, EnTeteSection, LienRetour, Page } from "@/ui/page";
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
    <Page>
      <LienRetour href="/tableau-de-bord">Accueil</LienRetour>
      <EnTetePage titre="Réglages" />

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

      <section className="mt-10">
        <EnTeteSection titre="Compte" />
        <Carte classe="mt-2 p-4">
          <div className="flex items-baseline justify-between gap-3 py-0.5 text-sm">
            <span className="text-gris">Email</span>
            <span className="truncate font-medium text-encre">{user.email}</span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-3 py-0.5 text-sm">
            <span className="text-gris">Mot de passe</span>
            <Link
              href="/nouveau-mot-de-passe"
              className="font-medium text-vert underline underline-offset-2"
            >
              Modifier
            </Link>
          </div>
        </Carte>
      </section>
    </Page>
  );
}
