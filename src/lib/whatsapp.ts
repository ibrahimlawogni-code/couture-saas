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

/*
 * La demande d'avis, envoyee apres la remise du vetement.
 *
 * Courte, et sans relance : c'est la derniere chose que le client lit de
 * l'atelier, elle ne doit pas ressembler a une reclamation. Le lien porte
 * un jeton propre a cette commande, qui ne vaut qu'une fois.
 */
export function messageAvis(
  atelier: string,
  client: string,
  commande: Commande,
  lienNotation: string
) {
  return [
    `Bonjour ${client},`,
    "",
    `J'espère que votre ${commande.nom_modele ?? "vêtement"} vous plaît.`,
    "",
    `Si vous avez un instant, dites-moi comment ça s'est passé — cela m'aide beaucoup :`,
    lienNotation,
    "",
    `Merci de votre confiance.`,
    atelier,
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
