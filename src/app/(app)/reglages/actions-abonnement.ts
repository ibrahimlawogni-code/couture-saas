"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAtelierId } from "@/lib/atelier";
import { creerSessionCheckout } from "@/lib/saspay";
import { createClient } from "@/lib/supabase/server";
import { TARIFS, estOffrePayante } from "@/lib/tarifs";

/**
 * Ouvre une page de paiement et y envoie la personne.
 *
 * Le formulaire ne transmet qu'un code d'offre et un nombre de mois. Ni le
 * montant ni l'atelier ne viennent du navigateur : le prix est lu dans
 * TARIFS cote serveur, et l'atelier est celui de la session. Sans cela,
 * n'importe qui s'offrirait Atelier Pro pour un franc, ou l'offrirait a
 * l'atelier d'un autre, en modifiant la requete.
 *
 * Les metadonnees deposees sur la session sont ce qui permettra, au retour,
 * de savoir qui crediter : la notification de SASPay ne les porte pas.
 */
export async function ouvrirPaiement(formulaire: FormData) {
  const offre = String(formulaire.get("offre") ?? "");
  const mois = Number(formulaire.get("mois") ?? 1);

  if (!estOffrePayante(offre)) {
    redirect("/reglages?paiement=offre_inconnue");
  }

  // Borne haute autant que basse : un nombre de mois absurde passerait
  // sinon en montant absurde sur la page de paiement.
  if (!Number.isInteger(mois) || mois < 1 || mois > 12) {
    redirect("/reglages?paiement=duree_invalide");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const atelierId = await getAtelierId();

  if (!user || !atelierId) {
    redirect("/login");
  }

  const { data: atelier } = await supabase
    .from("ateliers")
    .select("nom")
    .eq("id", atelierId)
    .single();

  const origine = (await headers()).get("origin") ?? "";
  const tarif = TARIFS[offre];

  let adresse: string;

  try {
    const session = await creerSessionCheckout({
      montant: tarif.parMois * mois,
      description: `TailorHub ${tarif.nom} — ${mois} mois`,
      clientNom: atelier?.nom ?? "Atelier",
      clientEmail: user.email ?? "",
      // Le retour passe par une route et non par un ecran : elle rapproche
      // le versement avant de rendre la main, pour que les reglages
      // affichent deja la nouvelle offre.
      retourUrl: `${origine}/api/paiements/retour`,
      metadonnees: {
        atelier_id: atelierId,
        formule: offre,
        mois: String(mois),
      },
    });

    adresse = session.checkout_url;
  } catch (erreur) {
    console.error("ouverture paiement", erreur);
    redirect("/reglages?paiement=indisponible");
  }

  // Hors du try : redirect() leve une exception que Next intercepte, et
  // l'attraper ici la ferait passer pour un echec d'ouverture.
  redirect(adresse);
}
