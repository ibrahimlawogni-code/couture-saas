"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "commandes";
const DIMENSION_MAX = 1600;
const QUALITE_JPEG = 0.8;

/**
 * Redimensionne et recompresse la photo dans le navigateur avant l'envoi.
 * Une photo de telephone passe ainsi de plusieurs Mo a quelques centaines de Ko,
 * ce qui compte beaucoup en connexion mobile instable.
 */
async function compresser(fichier: File): Promise<Blob> {
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

type Etat = "vide" | "envoi" | "pret" | "erreur";

export function PhotoUpload({
  name,
  label,
  atelierId,
}: {
  name: string;
  label: string;
  atelierId: string;
}) {
  const [etat, setEtat] = useState<Etat>("vide");
  const [chemin, setChemin] = useState("");
  const [apercu, setApercu] = useState<string | null>(null);

  async function handleChange(evenement: React.ChangeEvent<HTMLInputElement>) {
    const fichier = evenement.target.files?.[0];
    if (!fichier) return;

    setEtat("envoi");

    try {
      const blob = await compresser(fichier);
      const supabase = createClient();
      const cheminFichier = `${atelierId}/${crypto.randomUUID()}.jpg`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(cheminFichier, blob, { contentType: "image/jpeg" });

      if (error) throw error;

      setChemin(cheminFichier);
      setApercu(URL.createObjectURL(blob));
      setEtat("pret");
    } catch {
      setEtat("erreur");
    }
  }

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input type="hidden" name={name} value={chemin} />
      <input
        id={name}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-3 text-sm"
      />
      {etat === "envoi" && <p className="mt-1 text-xs text-zinc-500">Envoi en cours...</p>}
      {etat === "erreur" && (
        <p className="mt-1 text-xs text-red-600">Echec de l&apos;envoi, reessaie.</p>
      )}
      {etat === "pret" && apercu && (
        // Apercu local (blob), next/image n'apporte rien ici.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={apercu}
          alt="Apercu"
          className="mt-2 h-24 w-24 rounded-lg object-cover"
        />
      )}
    </div>
  );
}
