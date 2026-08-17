import { formaterMontant } from "@/lib/commandes";

const LARGEUR = 800;
const MARGE = 56;

/*
 * Les teintes de la marque, recopiees ici parce qu'un canvas ne lit pas
 * les variables CSS.
 *
 * Elles avaient diverge : le recu portait encore l'ancien gris #6b7a74,
 * remplace depuis pour contraste insuffisant, et deux gris zinc (#a1a1aa,
 * #e4e4e7) qui n'ont jamais appartenu a la palette. C'est le seul objet du
 * produit qui sorte de l'atelier, et il ne ressemblait pas au produit.
 */
const ENCRE = "#111e1a";
const GRIS = "#63726c";
const BORDURE = "#e3e8e6";
const VERT_PALE = "#9bc4b3";
const ROUGE = "#a8261e";
const VERT = "#12684e";
const FORET = "#0c3b2e";

export type DonneesRecu = {
  atelier: string;
  client: string;
  modele: string | null;
  prixTotal: number;
  versements: { date: string; montant: number; type: string }[];
  dateLivraison: string | null;
};

/*
 * Le type de versement vient de la base en minuscules et sans accent.
 * Il etait imprime tel quel sur un document destine au client.
 */
const TYPES: Record<string, string> = {
  acompte: "Acompte",
  complement: "Complément",
};

function formaterDate(valeur: string | null) {
  return valeur ? new Date(valeur).toLocaleDateString("fr-FR") : "à définir";
}

/**
 * Coupe un texte trop long pour la largeur disponible.
 *
 * Canvas ne replie ni ne rogne : fillText deborde simplement du cadre, et
 * un nom d'atelier un peu long partait hors de l'image. Le nom du client
 * et le modele posaient le meme probleme d'un autre cote, la valeur etant
 * alignee a droite : elle passait par-dessus son propre libelle.
 */
function tronquer(
  ctx: CanvasRenderingContext2D,
  texte: string,
  largeurMax: number
) {
  if (ctx.measureText(texte).width <= largeurMax) return texte;

  let coupe = texte;
  while (coupe.length > 1 && ctx.measureText(`${coupe}…`).width > largeurMax) {
    coupe = coupe.slice(0, -1);
  }

  return `${coupe.trimEnd()}…`;
}

/**
 * Dessine le recu ligne a ligne. Canvas evite toute dependance externe et
 * fonctionne hors connexion, ce qui compte pour un usage en atelier.
 */
export async function genererRecu(donnees: DonneesRecu): Promise<Blob> {
  /*
   * La police de l'application plutot que le sans-serif du systeme. Le
   * recu s'ecrivait dans la fonte par defaut de l'appareil, differente sur
   * chaque telephone et etrangere a la marque.
   *
   * document.fonts.ready garantit que DM Sans est chargee avant le trace :
   * un canvas dessine avec une fonte pas encore prete retombe
   * silencieusement sur la fonte de secours.
   */
  await document.fonts.ready;
  const police =
    getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";

  const hauteurEntete = 150;
  const hauteurLigne = 46;
  const nbVersements = donnees.versements.length;

  // Positions calculees d'avance : la hauteur du canvas doit etre connue
  // avant le trace, et la deduire d'une formule approchee laissait une
  // bande blanche de pres de deux cents pixels sous le total.
  const yInfos = hauteurEntete + MARGE;
  const yPrix = yInfos + hauteurLigne * 3 + 8;
  const yVersements = yPrix + hauteurLigne;
  const yDejaVerse = yVersements + 34 * nbVersements + 12;
  const yReste = yDejaVerse + hauteurLigne + 8;
  const yPied = yReste + 58;
  const hauteur = yPied + MARGE - 10;

  const canvas = document.createElement("canvas");
  canvas.width = LARGEUR;
  canvas.height = hauteur;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");

  const largeurUtile = LARGEUR - MARGE * 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, LARGEUR, hauteur);

  // En-tete, en vert foret comme les panneaux de l'application.
  ctx.fillStyle = FORET;
  ctx.fillRect(0, 0, LARGEUR, hauteurEntete);

  ctx.fillStyle = "#ffffff";
  ctx.font = `600 40px ${police}`;
  ctx.fillText(tronquer(ctx, donnees.atelier, largeurUtile), MARGE, 72);

  ctx.font = `400 24px ${police}`;
  ctx.fillStyle = VERT_PALE;
  ctx.fillText(`Reçu du ${new Date().toLocaleDateString("fr-FR")}`, MARGE, 110);

  let y = yInfos;

  const ligne = (libelle: string, valeur: string, gras = false) => {
    ctx.font = `400 26px ${police}`;
    ctx.fillStyle = GRIS;
    ctx.textAlign = "left";
    ctx.fillText(libelle, MARGE, y);
    const largeurLibelle = ctx.measureText(libelle).width;

    ctx.font = gras ? `600 30px ${police}` : `400 28px ${police}`;
    ctx.fillStyle = ENCRE;
    ctx.textAlign = "right";
    // La valeur ne doit jamais recouvrir son libelle : on lui laisse la
    // place restante, moins une respiration de vingt-quatre pixels.
    ctx.fillText(
      tronquer(ctx, valeur, largeurUtile - largeurLibelle - 24),
      LARGEUR - MARGE,
      y
    );
    ctx.textAlign = "left";

    y += hauteurLigne;
  };

  const separateur = (hauteurY: number) => {
    ctx.strokeStyle = BORDURE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGE, hauteurY);
    ctx.lineTo(LARGEUR - MARGE, hauteurY);
    ctx.stroke();
  };

  ligne("Client", donnees.client, true);
  ligne("Modèle", donnees.modele ?? "Non précisé");
  ligne("Livraison prévue", formaterDate(donnees.dateLivraison));

  separateur(yPrix - 28);
  y = yPrix;
  ligne("Prix total", formaterMontant(donnees.prixTotal), true);

  // Detail des versements, en retrait sous le prix.
  ctx.font = `400 22px ${police}`;
  y = yVersements;
  for (const versement of donnees.versements) {
    ctx.fillStyle = GRIS;
    ctx.textAlign = "left";
    ctx.fillText(
      `${new Date(versement.date).toLocaleDateString("fr-FR")} · ${
        TYPES[versement.type] ?? versement.type
      }`,
      MARGE + 16,
      y
    );
    ctx.textAlign = "right";
    ctx.fillText(formaterMontant(versement.montant), LARGEUR - MARGE, y);
    ctx.textAlign = "left";
    y += 34;
  }

  const totalVerse = donnees.versements.reduce(
    (somme, versement) => somme + versement.montant,
    0
  );
  const reste = donnees.prixTotal - totalVerse;

  y = yDejaVerse;
  ligne("Déjà versé", formaterMontant(totalVerse));

  separateur(yReste - 28);

  ctx.font = `600 30px ${police}`;
  ctx.fillStyle = GRIS;
  ctx.fillText("Reste à payer", MARGE, yReste);

  ctx.font = `700 34px ${police}`;
  ctx.fillStyle = reste > 0 ? ROUGE : VERT;
  ctx.textAlign = "right";
  ctx.fillText(
    reste > 0 ? formaterMontant(reste) : "Soldé",
    LARGEUR - MARGE,
    yReste
  );
  ctx.textAlign = "left";

  ctx.font = `400 22px ${police}`;
  ctx.fillStyle = GRIS;
  ctx.fillText("Merci de votre confiance.", MARGE, yPied);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Reçu illisible"))),
      "image/jpeg",
      0.92
    );
  });
}
