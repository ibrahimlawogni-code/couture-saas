"use server";

import { revalidatePath } from "next/cache";
import {
  administrateurConnecte,
  changerFormule,
  compteParEmail,
  nommerAdministrateur,
  revoquerAdministrateur,
} from "@/lib/admin";

/*
 * Chaque action revérifie que l'appelant est administrateur.
 *
 * Le layout le fait deja, mais une action serveur s'appelle par le reseau :
 * elle ne passe pas par le rendu de la page qui la contient. Quelqu'un qui
 * a vu l'ecran une fois - ou qui devine l'adresse - pourrait la declencher
 * apres avoir perdu le droit. La base le revérifie une troisieme fois, dans
 * la meme transaction que le journal.
 */

const REFUS: Record<string, string> = {
  non_administrateur: "Vous n'avez pas (ou plus) le droit d'administrer.",
  formule_inconnue: "Cette offre n'existe pas.",
  atelier_introuvable: "Cet atelier n'existe plus.",
  compte_introuvable: "Aucun compte ne porte cette adresse.",
  auto_revocation:
    "Vous ne pouvez pas vous retirer vous-même. Demandez-le à un autre administrateur.",
};

/** Traduit le refus leve par la base ; tait le reste. */
function messageRefus(brut: string | null) {
  if (!brut) return null;

  const cle = Object.keys(REFUS).find((motif) => brut.includes(motif));
  return cle ? REFUS[cle] : "L'opération n'a pas abouti. Réessayez.";
}

export type Resultat = { erreur: string | null };

export async function actionChangerFormule(
  _etat: Resultat,
  donnees: FormData
): Promise<Resultat> {
  const administrateur = await administrateurConnecte();
  if (!administrateur) return { erreur: REFUS.non_administrateur };

  const atelier = String(donnees.get("atelier") ?? "");
  const formule = String(donnees.get("formule") ?? "");

  const erreur = messageRefus(
    await changerFormule(atelier, formule, administrateur.id)
  );

  if (!erreur) revalidatePath("/admin");
  return { erreur };
}

export async function actionNommer(
  _etat: Resultat,
  donnees: FormData
): Promise<Resultat> {
  const administrateur = await administrateurConnecte();
  if (!administrateur) return { erreur: REFUS.non_administrateur };

  const email = String(donnees.get("email") ?? "").trim();
  if (!email) return { erreur: "Indiquez l'adresse du compte à nommer." };

  const compte = await compteParEmail(email);
  if (!compte) return { erreur: REFUS.compte_introuvable };

  const erreur = messageRefus(
    await nommerAdministrateur(compte.id, administrateur.id)
  );

  if (!erreur) revalidatePath("/admin");
  return { erreur };
}

export async function actionRevoquer(
  _etat: Resultat,
  donnees: FormData
): Promise<Resultat> {
  const administrateur = await administrateurConnecte();
  if (!administrateur) return { erreur: REFUS.non_administrateur };

  const compte = String(donnees.get("compte") ?? "");

  const erreur = messageRefus(
    await revoquerAdministrateur(compte, administrateur.id)
  );

  if (!erreur) revalidatePath("/admin");
  return { erreur };
}
