import { createClient } from "@/lib/supabase/server";

/** Renvoie l'atelier de l'utilisateur connecte, ou null si absent. */
export async function getAtelierId() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("utilisateurs")
    .select("atelier_id")
    .eq("id", user.id)
    .single();

  return data?.atelier_id ?? null;
}
