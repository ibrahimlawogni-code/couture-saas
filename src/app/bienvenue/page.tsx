import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { traduire } from "@/lib/i18n";
import { langueVisiteur } from "@/lib/langue-visiteur";
import { createClient } from "@/lib/supabase/server";
import { FormulaireBienvenue } from "./formulaire";

/*
 * Ecran d'arrivee d'une inscription par fournisseur externe.
 *
 * Il n'existe que pour un compte authentifie mais sans atelier - l'etat
 * dans lequel la migration 0010 laisse volontairement une inscription
 * Google, le nom de l'atelier n'etant pas connu au moment ou le compte est
 * cree. Une inscription par email ne passe jamais par ici.
 */
export default async function BienvenuePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Deja rattache : cet ecran n'a plus rien a demander. maybeSingle plutot
  // que single, l'absence de ligne etant ici le cas nominal et non une erreur.
  const { data: utilisateur } = await supabase
    .from("utilisateurs")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (utilisateur) {
    redirect("/tableau-de-bord");
  }

  // Google transmet le nom sous full_name, d'autres sous name.
  const langue = await langueVisiteur();
  const mots = traduire(langue);
  const metadonnees = user.user_metadata ?? {};
  const nomPropose = String(metadonnees.full_name ?? metadonnees.name ?? "");

  return (
    <div className="flex flex-1 lg:grid lg:grid-cols-2">
      <div className="flex flex-1 items-center justify-center bg-papier px-6 py-6">
        <div className="w-full max-w-xs">
          <Link href="/" className="text-lg font-semibold tracking-tight text-encre">
            TailorHub
          </Link>

          <FormulaireBienvenue
            nomPropose={nomPropose}
            erreur={error}
            langue={langue}
          />
        </div>
      </div>

      {/* Voir la note sur la page de connexion : visuel reserve au grand ecran. */}
      <div className="relative hidden lg:block">
        <Image
          src="/photos/atelier.jpg"
          alt={mots.acces.photoAtelier}
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-foret/55" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="max-w-sm text-2xl font-semibold leading-snug tracking-tight text-white">
            {mots.acces.plusQuUneEtape}
          </p>
        </div>
      </div>
    </div>
  );
}
