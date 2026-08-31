import { createClient } from "@supabase/supabase-js";
import { listerSessionsPayees, type SessionCheckout } from "./saspay";

/*
 * Rapprochement des versements SASPay et des ateliers.
 *
 * La notification de SASPay ne porte pas les metadonnees de la session :
 * elle donne un identifiant de transaction, un montant, un reseau, mais
 * rien qui dise a quel atelier crediter. Elle ne sert donc que de signal.
 * Ce qui fait foi, c'est la relecture des sessions chez SASPay - constatee
 * contre l'API reelle, pas supposee d'apres la documentation.
 *
 * Le meme travail est declenche par trois chemins : la notification, le
 * retour du navigateur apres paiement, et l'entretien nocturne. Aucun n'est
 * indispensable, et c'est voulu : un tailleur qui a paye doit voir son
 * atelier passer en Pro meme si sa connexion coupe au retour, meme si la
 * notification se perd.
 */

export type ResultatReconciliation = {
  examinees: number;
  creditees: number;
  ignorees: number;
};

function serveur() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) throw new Error("supabase_non_configure");

  return createClient(url, cle, { auth: { persistSession: false } });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ce qu'on a nous-memes depose sur la session au moment de l'ouvrir.
 *
 * Tout est revalide : ces valeurs ont fait l'aller-retour chez un tiers, et
 * une session creee a la main depuis le tableau de bord SASPay n'en portera
 * aucune. Mieux vaut l'ignorer que crediter un atelier au hasard.
 */
function lireMetadonnees(session: SessionCheckout) {
  const donnees = session.metadata ?? {};

  const atelier = String(donnees.atelier_id ?? "");
  const formule = String(donnees.formule ?? "");
  const mois = Number(donnees.mois ?? 0);

  if (!UUID.test(atelier)) return null;
  if (!formule) return null;
  if (!Number.isInteger(mois) || mois <= 0 || mois > 24) return null;

  return { atelier, formule, mois };
}

/**
 * Credite les ateliers dont la session est reglee et pas encore enregistree.
 *
 * L'identifiant de session sert de cle d'idempotence, et non celui de la
 * transaction : une session se regle au plus une fois, et son identifiant
 * est connu avec certitude, la ou la forme du champ transaction n'est
 * documentee nulle part. La contrainte d'unicite en base rattraperait de
 * toute facon un doublon ; le tri prealable evite seulement de la solliciter
 * pour rien a chaque passage.
 */
export async function reconcilierAbonnements(): Promise<ResultatReconciliation> {
  const { results } = await listerSessionsPayees();

  if (results.length === 0) {
    return { examinees: 0, creditees: 0, ignorees: 0 };
  }

  const supabase = serveur();

  const { data: connues } = await supabase
    .from("paiements_abonnement")
    .select("transaction_externe")
    .in(
      "transaction_externe",
      results.map((session) => session.id)
    );

  const dejaVues = new Set(
    (connues ?? []).map((ligne) => ligne.transaction_externe as string)
  );

  let creditees = 0;
  let ignorees = 0;

  for (const session of results) {
    if (dejaVues.has(session.id)) continue;

    const metadonnees = lireMetadonnees(session);
    if (!metadonnees) {
      ignorees += 1;
      continue;
    }

    const { error } = await supabase.rpc("enregistrer_paiement_abonnement", {
      p_atelier: metadonnees.atelier,
      p_transaction: session.id,
      p_formule: metadonnees.formule,
      p_mois: metadonnees.mois,
      p_montant: Number(session.amount),
      p_devise: session.currency,
    });

    if (error) {
      // Un atelier efface entre-temps, une formule retiree du catalogue :
      // on passe au suivant plutot que d'abandonner tout le lot.
      console.error(`abonnement ${session.id} : ${error.message}`);
      ignorees += 1;
      continue;
    }

    creditees += 1;
  }

  return { examinees: results.length, creditees, ignorees };
}
