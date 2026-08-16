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
  // L'URL etait affirmee non nulle plus bas sans avoir ete verifiee ici :
  // absente, elle faisait echouer createClient sur une erreur obscure au
  // lieu du message de configuration prevu juste en dessous.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!secret || !cle || !url) {
    return NextResponse.json(
      { erreur: "Purge non configurée sur ce déploiement." },
      { status: 500 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Non autorisé." }, { status: 401 });
  }

  const supabase = createClient(url, cle, {
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

    /*
     * La liste est paginee : on boucle tant qu'une page revient pleine.
     *
     * La boucle avance parce que chaque page est effacee avant la
     * suivante, et repart donc du debut sur ce qui reste. Cela veut dire
     * qu'un echec d'effacement la ferait tourner sans fin sur les memes
     * cent fichiers - d'ou la remontee de l'erreur plutot que son
     * abandon. Une purge incomplete se rattrape la nuit suivante ; une
     * route qui ne rend jamais la main, non.
     */
    for (;;) {
      const { data: fichiers, error: erreurListe } = await supabase.storage
        .from(BUCKET)
        .list(atelierId, { limit: 100 });

      if (erreurListe) throw erreurListe;
      if (!fichiers?.length) return total;

      const { error: erreurSuppression } = await supabase.storage
        .from(BUCKET)
        .remove(fichiers.map((fichier) => `${atelierId}/${fichier.name}`));

      if (erreurSuppression) throw erreurSuppression;

      total += fichiers.length;

      if (fichiers.length < 100) return total;
    }
  }

  let photosEffacees = 0;

  /*
   * Un echec sur le bucket arrete la purge avant toute suppression de
   * ligne. C'est l'ordre voulu : mieux vaut un atelier qui reste a
   * effacer qu'un atelier dont les lignes sont parties en laissant ses
   * photos derriere elles, que plus rien ne designerait.
   */
  try {
    for (const atelier of candidats as { id: string }[]) {
      photosEffacees += await viderDossier(atelier.id);
    }
  } catch (erreur) {
    return NextResponse.json(
      {
        erreur: `Effacement des photos interrompu : ${
          (erreur as { message?: string })?.message ?? "cause inconnue"
        }`,
        photos: photosEffacees,
      },
      { status: 500 }
    );
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
