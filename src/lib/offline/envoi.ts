import { createClient } from "@/lib/supabase/client";
import type { PhotoEnAttente, TableSynchronisable } from "./db";

const BUCKET = "commandes";

/**
 * Ecrit une ligne dans Supabase depuis le navigateur, photos comprises.
 * L'identifiant etant genere localement, un rejeu ne cree pas de doublon.
 */
export async function envoyerVersSupabase(
  table: TableSynchronisable,
  donnees: Record<string, unknown>,
  photos: PhotoEnAttente[] = []
) {
  const supabase = createClient();

  for (const photo of photos) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(photo.chemin, photo.blob, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw error;
  }

  const { error } = await supabase
    .from(table)
    .upsert(donnees, { onConflict: "id", ignoreDuplicates: true });

  if (error) throw error;
}
