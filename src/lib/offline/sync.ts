import { envoyerVersSupabase } from "./envoi";
import { listerFile, marquerTentative, retirerDeLaFile } from "./outbox";

const TENTATIVES_MAX = 5;

let enCours = false;

export type ResultatSync = {
  envoyees: number;
  restantes: number;
};

/**
 * Rejoue la file dans l'ordre d'enregistrement. S'arrete a la premiere
 * operation qui echoue, pour ne jamais envoyer une commande avant le
 * client auquel elle se rattache.
 */
export async function synchroniser(): Promise<ResultatSync> {
  if (enCours) {
    return { envoyees: 0, restantes: (await listerFile()).length };
  }

  enCours = true;
  let envoyees = 0;

  try {
    for (const operation of await listerFile()) {
      if (operation.echec) continue;

      try {
        await envoyerVersSupabase(
          operation.table,
          operation.donnees,
          operation.photos
        );
        await retirerDeLaFile(operation.id);
        envoyees += 1;
      } catch {
        const definitif = operation.tentatives + 1 >= TENTATIVES_MAX;
        await marquerTentative(operation, definitif);
        break;
      }
    }
  } finally {
    enCours = false;
  }

  return { envoyees, restantes: (await listerFile()).length };
}
