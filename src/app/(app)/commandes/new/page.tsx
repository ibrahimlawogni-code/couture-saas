import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAtelierId } from "@/lib/atelier";
import { FormulaireCommande } from "./formulaire";

export default async function NewCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: clientPreselectionne } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const atelierId = await getAtelierId();

  if (!user || !atelierId) {
    redirect("/login");
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, nom")
    .order("nom");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href="/commandes" className="text-sm text-gris">
        &larr; Retour
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-encre">Nouvelle commande</h1>

      <FormulaireCommande
        atelierId={atelierId}
        utilisateurId={user.id}
        clients={clients ?? []}
        clientPreselectionne={clientPreselectionne}
      />
    </div>
  );
}
