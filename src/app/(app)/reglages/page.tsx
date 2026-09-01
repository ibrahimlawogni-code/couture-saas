import Link from "next/link";
import { redirect } from "next/navigation";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { administrateurConnecte } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { getAtelierId } from "@/lib/atelier";
import { Carte } from "@/ui/carte";
import { EnTetePage, EnTeteSection, LienRetour, Page } from "@/ui/page";
import { Abonnement } from "./abonnement";
import { Equipe, type Invitation, type Membre } from "./equipe";
import { FormulaireReglages } from "./formulaire";

export default async function ReglagesPage({
  searchParams,
}: {
  searchParams: Promise<{ paiement?: string }>;
}) {
  const { paiement } = await searchParams;
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
        .select(
          "nom, limite_utilisateurs, telephone, whatsapp_number, formule, abonnement_jusquau, langue"
        )
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
  const estAdministrateur = Boolean(await administrateurConnecte());

  return (
    <Page>
      <LienRetour href="/tableau-de-bord">Accueil</LienRetour>
      <EnTetePage titre="Réglages" />

      <FormulaireReglages
        atelierId={atelierId}
        utilisateurId={user.id}
        nomAtelier={atelier?.nom ?? ""}
        nomUtilisateur={moi?.nom ?? ""}
        telephoneAtelier={atelier?.telephone ?? ""}
        whatsappAtelier={atelier?.whatsapp_number ?? ""}
        langueAtelier={atelier?.langue ?? "fr"}
      />

      <Equipe
        atelierId={atelierId}
        utilisateurId={user.id}
        estProprietaire={moi?.role === "proprietaire"}
        membres={(membres ?? []) as Membre[]}
        invitations={(invitations ?? []) as Invitation[]}
        places={atelier?.limite_utilisateurs ?? 6}
      />

      <Abonnement
        formule={atelier?.formule ?? "decouverte"}
        echeance={atelier?.abonnement_jusquau ?? null}
        retour={paiement}
      />

      {/*
       * L'arriere-guichet ne s'annonce qu'a ceux qui y ont droit. Poser le
       * lien pour tout le monde et laisser la garde refuser apprendrait a
       * chaque tailleur que cette adresse existe.
       */}
      {estAdministrateur && (
        <section className="mt-10">
          <EnTeteSection titre="Plateforme" />
          <Carte classe="mt-2 p-4">
            <Link
              href="/admin"
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="min-w-0">
                <span className="block font-medium text-encre">
                  Administration TailorHub
                </span>
                <span className="block text-gris">
                  Les ateliers inscrits et leur offre
                </span>
              </span>
              <CaretRight size={14} weight="bold" className="shrink-0 text-gris" />
            </Link>
          </Carte>
        </section>
      )}

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
