import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const BUCKET = "commandes";

/**
 * Efface les ateliers abandonnes depuis plus de trente jours.
 *
 * Le travail se fait ici plutot qu'en SQL parce que Postgres refuse toute
 * suppression directe dans storage.objects : les photos ne partent que par
 * l'API Storage. L'ordre compte. Les fichiers d'abord, les lignes ensuite :
 * une interruption laisse alors des lignes sans photos, rattrapees au
 * passage suivant, au lieu de fichiers que plus aucune ligne ne designe.
 *
 * Appelee chaque nuit par la planification Vercel, qui presente le secret
 * en en-tete. Sans ce secret, l'adresse ne repond pas.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !cle) {
    return NextResponse.json(
      { erreur: "Purge non configurée sur ce déploiement." },
      { status: 500 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Non autorisé." }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, cle, {
    auth: { persistSession: false },
  });

  const { data: candidats, error } = await supabase.rpc("lister_ateliers_a_purger");

  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  if (!candidats?.length) {
    return NextResponse.json({ examines: 0, effaces: [], photos: 0 });
  }

  /** Vide <atelier_id>/ du bucket, par pages, et renvoie le nombre de fichiers. */
  async function viderDossier(atelierId: string) {
    let total = 0;

    // La liste est paginee : on boucle tant qu'une page revient pleine.
    for (;;) {
      const { data: fichiers } = await supabase.storage
        .from(BUCKET)
        .list(atelierId, { limit: 100 });

      if (!fichiers?.length) return total;

      await supabase.storage
        .from(BUCKET)
        .remove(fichiers.map((fichier) => `${atelierId}/${fichier.name}`));

      total += fichiers.length;

      if (fichiers.length < 100) return total;
    }
  }

  let photosEffacees = 0;

  for (const atelier of candidats as { id: string }[]) {
    photosEffacees += await viderDossier(atelier.id);
  }

  const { data: effaces, error: erreurPurge } = await supabase.rpc(
    "purger_ateliers_orphelins"
  );

  if (erreurPurge) {
    return NextResponse.json({ erreur: erreurPurge.message }, { status: 500 });
  }

  return NextResponse.json({
    examines: candidats.length,
    effaces: (effaces ?? []).map((a: { nom: string }) => a.nom),
    photos: photosEffacees,
  });
}
