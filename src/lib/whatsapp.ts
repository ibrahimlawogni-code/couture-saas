import { STATUT_LABELS, formaterMontant, type Statut } from "@/lib/commandes";

const INDICATIF_BENIN = "229";

/**
 * wa.me attend un numero international sans "+" ni separateur.
 * Un numero saisi localement (01 97 63 63 01) est prefixe de l'indicatif.
 */
export function normaliserNumero(numero: string | null): string | null {
  if (!numero) return null;

  const chiffres = numero.replace(/\D/g, "");
  if (!chiffres) return null;

  return chiffres.startsWith(INDICATIF_BENIN)
    ? chiffres
    : `${INDICATIF_BENIN}${chiffres}`;
}

export function lienWhatsApp(numero: string | null, message: string): string | null {
  const destinataire = normaliserNumero(numero);
  if (!destinataire) return null;

  return `https://wa.me/${destinataire}?text=${encodeURIComponent(message)}`;
}

function formaterDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString("fr-FR") : "à définir";
}

type Commande = {
  nom_modele: string | null;
  statut: Statut;
  prix_total: number;
  date_essayage: string | null;
  date_livraison: string | null;
};

export function messageRecapitulatif(
  atelier: string,
  client: string,
  commande: Commande,
  resteAPayer: number
) {
  return [
    `Bonjour ${client},`,
    "",
    `Voici le récapitulatif de votre commande chez ${atelier} :`,
    `Modèle : ${commande.nom_modele ?? "à préciser"}`,
    `Prix total : ${formaterMontant(commande.prix_total)}`,
    `Reste à payer : ${formaterMontant(resteAPayer)}`,
    `Essayage : ${formaterDate(commande.date_essayage)}`,
    `Livraison : ${formaterDate(commande.date_livraison)}`,
    `État : ${STATUT_LABELS[commande.statut]}`,
    "",
    "Merci de votre confiance.",
  ].join("\n");
}

export function messageRappelEssayage(
  atelier: string,
  client: string,
  commande: Commande
) {
  return [
    `Bonjour ${client},`,
    "",
    `Petit rappel : votre essayage chez ${atelier} est prévu le ${formaterDate(
      commande.date_essayage
    )}.`,
    "",
    "À bientôt.",
  ].join("\n");
}

export function messagePret(
  atelier: string,
  client: string,
  commande: Commande,
  resteAPayer: number
) {
  const lignes = [
    `Bonjour ${client},`,
    "",
    `Votre ${commande.nom_modele ?? "vêtement"} est prêt chez ${atelier}, vous pouvez venir le retirer.`,
  ];

  if (resteAPayer > 0) {
    lignes.push(`Reste à payer : ${formaterMontant(resteAPayer)}.`);
  }

  lignes.push("", "À bientôt.");
  return lignes.join("\n");
}
