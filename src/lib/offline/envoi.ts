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

  const { data, error } = await supabase
    .from(table)
    .upsert(donnees, { onConflict: "id", ignoreDuplicates: true })
    .select()
    .maybeSingle();

  if (error) throw error;

  // La ligne est renvoyee telle que la base l'a ecrite, valeurs par defaut
  // comprises : c'est elle qu'on range dans la copie locale, sinon un
  // statut ou une date calcules par Postgres manqueraient a l'affichage.
  if (data) return data as Record<string, unknown>;

  // Rejeu d'une operation deja passee : l'upsert n'a rien renvoye, on
  // relit la ligne pour disposer quand meme de sa version reelle.
  const { data: relue } = await supabase
    .from(table)
    .select()
    .eq("id", String(donnees.id))
    .maybeSingle();

  return (relue as Record<string, unknown>) ?? donnees;
}
