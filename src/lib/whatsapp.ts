import { formaterMontant, type Statut } from "@/lib/commandes";
import type { Traductions } from "@/lib/i18n";

const INDICATIF_BENIN = "229";

/**
 * wa.me attend un numero international sans "+" ni separateur.
 *
 * Un numero beninois se saisit couramment sans indicatif : on le complete
 * plutot que de refuser un numero que le tailleur juge, lui, tout a fait
 * normal.
 */
export function normaliserNumero(numero: string | null): string | null {
  if (!numero) return null;

  const chiffres = numero.replace(/\D/g, "");
  if (chiffres.length < 8) return null;

  return chiffres.length === 8 ? `${INDICATIF_BENIN}${chiffres}` : chiffres;
}

export function lienWhatsApp(numero: string | null, message: string): string | null {
  const destinataire = normaliserNumero(numero);
  if (!destinataire) return null;

  return `https://wa.me/${destinataire}?text=${encodeURIComponent(message)}`;
}

/*
 * Les messages suivent la langue de l'atelier, comme le recu.
 *
 * Ils sont adresses au client du tailleur, et non au tailleur : un atelier
 * et sa clientele partagent le meme marche, et c'est donc la langue de
 * l'atelier qui vaut, pas celle de l'apprenti qui appuie sur le bouton.
 */
function formaterDate(date: string | null, mots: Traductions) {
  return date
    ? new Date(date).toLocaleDateString(mots.locale)
    : mots.documents.aDefinir;
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
  resteAPayer: number,
  mots: Traductions
) {
  const d = mots.documents;

  return [
    d.bonjour(client),
    "",
    d.recapitulatifIntro(atelier),
    d.ligneModele(commande.nom_modele ?? d.aPreciser),
    d.lignePrixTotal(formaterMontant(commande.prix_total, mots.locale)),
    d.ligneResteAPayer(formaterMontant(resteAPayer, mots.locale)),
    d.ligneEssayage(formaterDate(commande.date_essayage, mots)),
    d.ligneLivraison(formaterDate(commande.date_livraison, mots)),
    d.ligneEtat(mots.statuts[commande.statut]),
    "",
    d.merci,
  ].join("\n");
}

export function messageRappelEssayage(
  atelier: string,
  client: string,
  commande: Commande,
  mots: Traductions
) {
  const d = mots.documents;

  return [
    d.bonjour(client),
    "",
    d.rappelEssayage(atelier, formaterDate(commande.date_essayage, mots)),
    "",
    d.aBientot,
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
  lienNotation: string,
  mots: Traductions
) {
  const d = mots.documents;

  return [
    d.bonjour(client),
    "",
    d.avisIntro(commande.nom_modele ?? d.vetement),
    "",
    d.avisDemande,
    lienNotation,
    "",
    d.merci,
    atelier,
  ].join("\n");
}

export function messagePret(
  atelier: string,
  client: string,
  commande: Commande,
  resteAPayer: number,
  mots: Traductions
) {
  const d = mots.documents;

  const lignes = [
    d.bonjour(client),
    "",
    d.pretIntro(commande.nom_modele ?? d.vetement, atelier),
  ];

  if (resteAPayer > 0) {
    lignes.push(d.pretReste(formaterMontant(resteAPayer, mots.locale)));
  }

  lignes.push("", d.aBientot);
  return lignes.join("\n");
}
