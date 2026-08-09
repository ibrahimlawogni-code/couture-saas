import { envoyerVersSupabase } from "./envoi";
import { mettreEnFile } from "./outbox";
import type { PhotoEnAttente, TableSynchronisable } from "./db";

export type ResultatEnregistrement = { enFile: boolean };

/**
 * Tente l'ecriture immediate, et bascule dans la file locale si le reseau
 * ne repond pas. L'appelant peut donc toujours continuer son travail.
 */
export async function enregistrer(
  table: TableSynchronisable,
  donnees: Record<string, unknown>,
  photos: PhotoEnAttente[] = []
): Promise<ResultatEnregistrement> {
  if (navigator.onLine) {
    try {
      await envoyerVersSupabase(table, donnees, photos);
      return { enFile: false };
    } catch {
      // Reseau annonce comme disponible mais injoignable : on met en file.
    }
  }

  await mettreEnFile(table, donnees, photos);
  return { enFile: true };
}
