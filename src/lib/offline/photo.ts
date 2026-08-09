const DIMENSION_MAX = 1600;
const QUALITE_JPEG = 0.8;

/**
 * Redimensionne et recompresse dans le navigateur. Une photo de telephone
 * passe de plusieurs Mo a quelques centaines de Ko, ce qui compte autant
 * pour la vitesse d'envoi que pour la place occupee en file locale.
 */
export async function compresserPhoto(fichier: File): Promise<Blob> {
  const image = await createImageBitmap(fichier);
  const ratio = Math.min(1, DIMENSION_MAX / Math.max(image.width, image.height));
  const largeur = Math.round(image.width * ratio);
  const hauteur = Math.round(image.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;

  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Canvas indisponible");
  contexte.drawImage(image, 0, 0, largeur, hauteur);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression impossible"))),
      "image/jpeg",
      QUALITE_JPEG
    );
  });
}

export function cheminPhoto(atelierId: string) {
  return `${atelierId}/${crypto.randomUUID()}.jpg`;
}
