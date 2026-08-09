import Link from "next/link";
import { redirect } from "next/navigation";
import { getAtelierId } from "@/lib/atelier";
import { FormulaireClient } from "./formulaire";

export default async function NewClientPage() {
  const atelierId = await getAtelierId();

  if (!atelierId) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Link href="/clients" className="text-sm text-zinc-500">
        &larr; Retour
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-zinc-900">Nouveau client</h1>

      <FormulaireClient atelierId={atelierId} />
    </div>
  );
}
