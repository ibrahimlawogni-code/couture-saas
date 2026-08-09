"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const CHAMPS_STANDARDS = [
  "poitrine",
  "taille",
  "hanches",
  "longueur_bras",
  "longueur_jambe",
  "col",
  "epaule",
];

export async function createMesureAction(formData: FormData) {
  const clientId = String(formData.get("client_id") ?? "");
  const libelle = String(formData.get("libelle") ?? "Mesures").trim() || "Mesures";

  const valeurs: Record<string, number | string> = {};

  for (const cle of CHAMPS_STANDARDS) {
    const valeur = formData.get(cle);
    if (valeur && String(valeur).trim() !== "") {
      valeurs[cle] = Number(valeur);
    }
  }

  const customNom = String(formData.get("champ_custom_nom") ?? "").trim();
  const customValeur = String(formData.get("champ_custom_valeur") ?? "").trim();
  if (customNom && customValeur) {
    valeurs[customNom] = customValeur;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("mesures").insert({
    client_id: clientId,
    libelle,
    valeurs,
    pris_par: user?.id ?? null,
  });

  if (error) {
    redirect(
      `/clients/${clientId}/mesures/new?error=${encodeURIComponent(
        "Impossible d'enregistrer la mesure"
      )}`
    );
  }

  redirect(`/clients/${clientId}`);
}
