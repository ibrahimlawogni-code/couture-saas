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

export type StatutSession = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

export type SessionCheckout = {
  id: string;
  slug: string;
  checkout_url: string;
  status: StatutSession;
  amount: string;
  currency: string;
  metadata: Record<string, unknown>;
  transaction: unknown;
  paid_at: string | null;
};

/*
 * Toutes les reponses arrivent enveloppees dans { success, data, code },
 * la ou les exemples de la documentation montrent l'objet nu. Constate
 * contre l'API reelle, pas suppose : la premiere version de ce fichier
 * lisait l'objet nu et ne trouvait que des champs indefinis.
 */
async function appeler<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  const reponse = await fetch(`${BASE}${chemin}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${cleSecrete()}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const texte = await reponse.text();

  if (!reponse.ok) {
    // Le corps d'erreur peut etre du HTML sur un 404 : on le tronque plutot
    // que de le supposer JSON.
    throw new Error(`saspay_${reponse.status}: ${texte.slice(0, 300)}`);
  }

  const corps = JSON.parse(texte);
  return (corps?.data ?? corps) as T;
}

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
  return appeler<SessionCheckout>("/checkout-sessions/", {
    method: "POST",
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
}

/** Relit une session chez SASPay : c'est elle qui fait foi, pas la notification. */
export function lireSessionCheckout(id: string) {
  return appeler<SessionCheckout>(`/checkout-sessions/${id}/`);
}

/**
 * Les sessions reglees, les plus recentes d'abord.
 *
 * C'est le seul chemin fiable pour rattacher un versement a un atelier : la
 * notification de SASPay ne porte pas les metadonnees de la session, donc
 * rien qui dise a qui crediter. La session, elle, les conserve - verifie
 * contre l'API reelle.
 *
 * Une page suffit. La notification arrive dans la seconde qui suit le
 * paiement, et l'entretien nocturne repasse derriere : une session reglee
 * ne peut pas s'enfoncer dans la liste avant d'avoir ete vue.
 */
export function listerSessionsPayees(parPage = 50) {
  return appeler<{ count: number; results: SessionCheckout[] }>(
    `/checkout-sessions/?status=PAID&page_size=${parPage}`
  );
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
