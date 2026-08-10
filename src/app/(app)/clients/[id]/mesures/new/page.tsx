import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormulaireMesure } from "./formulaire";

export default async function NewMesurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href={`/clients/${id}`} className="text-sm text-gris">
        &larr; Retour
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-encre">Nouvelle mesure</h1>

      <FormulaireMesure clientId={id} utilisateurId={user.id} />
    </div>
  );
}
