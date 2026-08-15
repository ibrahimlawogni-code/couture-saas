import { envoyerVersSupabase } from "./envoi";
import { poserDansMiroir } from "./miroir";
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
      const ligne = await envoyerVersSupabase(table, donnees, photos);
      // Sans ce report, l'ecran de detail ouvert juste apres ne trouverait
      // pas la ligne : il ne lit que la copie locale.
      await poserDansMiroir(table, ligne);
      return { enFile: false };
    } catch {
      // Reseau annonce comme disponible mais injoignable : on met en file.
    }
  }

  await mettreEnFile(table, donnees, photos);
  return { enFile: true };
}
