import { formaterMontant } from "@/lib/commandes";

const LARGEUR = 800;
const MARGE = 56;
const NOIR = "#18181b";
const GRIS = "#71717a";
const ROUGE = "#dc2626";
const VERT = "#059669";

export type DonneesRecu = {
  atelier: string;
  client: string;
  modele: string | null;
  prixTotal: number;
  versements: { date: string; montant: number; type: string }[];
  dateLivraison: string | null;
};

function formaterDate(valeur: string | null) {
  return valeur ? new Date(valeur).toLocaleDateString("fr-FR") : "a definir";
}

/**
 * Dessine le recu ligne a ligne. Canvas evite toute dependance externe et
 * fonctionne hors connexion, ce qui compte pour un usage en atelier.
 */
export async function genererRecu(donnees: DonneesRecu): Promise<Blob> {
  const hauteurEntete = 140;
  const hauteurLigne = 46;
  const hauteurVersements = donnees.versements.length * 34;
  const hauteur =
    hauteurEntete + hauteurLigne * 6 + hauteurVersements + MARGE * 3 + 120;

  const canvas = document.createElement("canvas");
  canvas.width = LARGEUR;
  canvas.height = hauteur;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, LARGEUR, hauteur);

  // Entete
  ctx.fillStyle = NOIR;
  ctx.fillRect(0, 0, LARGEUR, hauteurEntete);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 40px sans-serif";
  ctx.fillText(donnees.atelier, MARGE, 66);
  ctx.font = "400 24px sans-serif";
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText(
    `Recu du ${new Date().toLocaleDateString("fr-FR")}`,
    MARGE,
    104
  );

  let y = hauteurEntete + MARGE + 10;

  const ligne = (libelle: string, valeur: string, gras = false) => {
    ctx.font = "400 26px sans-serif";
    ctx.fillStyle = GRIS;
    ctx.textAlign = "left";
    ctx.fillText(libelle, MARGE, y);

    ctx.font = gras ? "600 30px sans-serif" : "400 28px sans-serif";
    ctx.fillStyle = NOIR;
    ctx.textAlign = "right";
    ctx.fillText(valeur, LARGEUR - MARGE, y);
    ctx.textAlign = "left";

    y += hauteurLigne;
  };

  const separateur = () => {
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGE, y - 26);
    ctx.lineTo(LARGEUR - MARGE, y - 26);
    ctx.stroke();
    y += 8;
  };

  ligne("Client", donnees.client, true);
  ligne("Modele", donnees.modele ?? "Non precise");
  ligne("Livraison prevue", formaterDate(donnees.dateLivraison));

  separateur();

  ligne("Prix total", formaterMontant(donnees.prixTotal), true);

  // Detail des versements
  ctx.font = "400 22px sans-serif";
  for (const versement of donnees.versements) {
    ctx.fillStyle = GRIS;
    ctx.fillText(
      `${new Date(versement.date).toLocaleDateString("fr-FR")} · ${versement.type}`,
      MARGE + 16,
      y - 12
    );
    ctx.textAlign = "right";
    ctx.fillText(formaterMontant(versement.montant), LARGEUR - MARGE, y - 12);
    ctx.textAlign = "left";
    y += 34;
  }

  y += 12;

  const totalVerse = donnees.versements.reduce(
    (somme, versement) => somme + versement.montant,
    0
  );
  const reste = donnees.prixTotal - totalVerse;

  ligne("Deja verse", formaterMontant(totalVerse));

  separateur();

  ctx.font = "600 30px sans-serif";
  ctx.fillStyle = GRIS;
  ctx.fillText("Reste a payer", MARGE, y);
  ctx.font = "700 34px sans-serif";
  ctx.fillStyle = reste > 0 ? ROUGE : VERT;
  ctx.textAlign = "right";
  ctx.fillText(formaterMontant(reste), LARGEUR - MARGE, y);
  ctx.textAlign = "left";

  ctx.font = "400 22px sans-serif";
  ctx.fillStyle = GRIS;
  ctx.fillText("Merci de votre confiance.", MARGE, hauteur - MARGE);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Recu illisible"))),
      "image/jpeg",
      0.92
    );
  });
}
