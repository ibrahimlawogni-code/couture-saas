import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * Acces a SASPay, le prestataire qui encaisse les abonnements.
 *
 * Uniquement cote serveur : la cle secrete autorise a encaisser, et une
 * variable sans prefixe NEXT_PUBLIC_ ne part jamais dans le navigateur.
 */

const BASE = process.env.SASPAY_API_URL ?? "https://api.saspay.me/api/v1";

function cleSecrete() {
  const cle = process.env.SASPAY_SECRET_KEY;
  if (!cle) throw new Error("saspay_non_configure");
  return cle;
}

export type SessionCheckout = {
  id: string;
  checkout_url: string;
  status: string;
  metadata: Record<string, unknown>;
};

/**
 * Ouvre une page de paiement hebergee et rend l'adresse ou envoyer la
 * personne.
 *
 * Le montant part en chaine et non en nombre : c'est ce qu'attend l'API, et
 * un flottant se serait charge d'imprecision sur des sommes en francs CFA
 * dont le centime n'existe pas.
 *
 * Les metadonnees portent l'atelier et ce qui a ete achete. SASPay les
 * conserve sur la session ; c'est par elles qu'on saura, au moment de la
 * verification, a qui attribuer le versement.
 */
export async function creerSessionCheckout(entree: {
  montant: number;
  devise?: string;
  description?: string;
  pays?: string;
  clientNom: string;
  clientEmail: string;
  retourUrl?: string;
  metadonnees: Record<string, string>;
}): Promise<SessionCheckout> {
  const reponse = await fetch(`${BASE}/checkout-sessions/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cleSecrete()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: entree.montant.toFixed(2),
      currency: entree.devise ?? "XOF",
      country: entree.pays ?? "BJ",
      description: entree.description,
      customer_name: entree.clientNom,
      customer_email: entree.clientEmail,
      return_url: entree.retourUrl,
      metadata: entree.metadonnees,
    }),
  });

  if (!reponse.ok) {
    throw new Error(
      `saspay_refus_${reponse.status}: ${(await reponse.text()).slice(0, 300)}`
    );
  }

  return (await reponse.json()) as SessionCheckout;
}

/** Relit une session chez SASPay : c'est elle qui fait foi, pas la notification. */
export async function lireSessionCheckout(id: string): Promise<SessionCheckout> {
  const reponse = await fetch(`${BASE}/checkout-sessions/${id}/`, {
    headers: { Authorization: `Bearer ${cleSecrete()}` },
  });

  if (!reponse.ok) {
    throw new Error(`saspay_lecture_${reponse.status}`);
  }

  return (await reponse.json()) as SessionCheckout;
}

/**
 * Ecart tolere entre l'horodatage de la notification et notre horloge.
 *
 * Sans ce controle, une notification interceptee pourrait etre rejouee des
 * mois plus tard : la signature, elle, resterait valable indefiniment.
 */
const FENETRE_SECONDES = 5 * 60;

/**
 * Verifie qu'une notification vient bien de SASPay.
 *
 * La signature couvre l'horodatage et le corps, separes par un point, en
 * HMAC-SHA256 hexadecimal minuscule.
 *
 * Comparaison a temps constant : un `===` sur des chaines s'arrete au
 * premier caractere different, et ce temps de reponse suffit a reconstruire
 * une signature valable octet par octet.
 */
export function verifierSignature(entree: {
  corps: string;
  signature: string | null;
  horodatage: string | null;
  maintenant?: number;
}): boolean {
  const secret = process.env.SASPAY_WEBHOOK_SECRET;
  if (!secret || !entree.signature || !entree.horodatage) return false;

  const envoye = Number(entree.horodatage);
  if (!Number.isFinite(envoye)) return false;

  const maintenant = entree.maintenant ?? Math.floor(Date.now() / 1000);
  if (Math.abs(maintenant - envoye) > FENETRE_SECONDES) return false;

  const attendue = createHmac("sha256", secret)
    .update(`${entree.horodatage}.${entree.corps}`)
    .digest("hex");

  // timingSafeEqual exige deux tampons de meme longueur, et jette sinon.
  const a = Buffer.from(attendue, "utf8");
  const b = Buffer.from(entree.signature.trim().toLowerCase(), "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
