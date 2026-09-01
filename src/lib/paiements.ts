/*
 * Le moyen par lequel l'argent est arrive.
 *
 * La colonne existe en base depuis la premiere migration, avec ces trois
 * valeurs exactes et « especes » par defaut - mais aucun ecran ne l'a
 * jamais ecrite. Tous les versements enregistres jusqu'ici sont donc
 * comptes en especes, y compris ceux recus par Mobile Money, et rien ne
 * permet de les distinguer apres coup.
 *
 * Les libelles doivent rester alignes sur la contrainte de la base
 * (0001_init.sql) : une valeur inventee ici serait refusee a l'ecriture,
 * et hors ligne le refus n'arriverait qu'a la synchronisation, longtemps
 * apres que le tailleur a rendu le vetement.
 */
export const METHODES = ["especes", "mobile_money", "virement"] as const;

export type Methode = (typeof METHODES)[number];

/*
 * Les libelles ont rejoint i18n.ts, ou ils existent dans chaque langue. Ce
 * module garde les codes : un versement reste « especes » en base quelle
 * que soit la langue de l'atelier.
 */

/*
 * Les especes restent le defaut : c'est ce qui se passe au comptoir, et la
 * valeur juste doit etre celle qui ne demande aucun geste.
 */
export const METHODE_DEFAUT: Methode = "especes";

/** Une valeur venue de la base, ramenee a ce que l'application connait. */
export function methodeConnue(valeur: string | null | undefined): Methode {
  return METHODES.includes(valeur as Methode)
    ? (valeur as Methode)
    : METHODE_DEFAUT;
}

/**
 * Repartition des encaissements par moyen, du plus gros au plus petit.
 *
 * Rend les montants et leur part, pour que l'ecran des finances n'ait pas
 * a refaire la somme puis la division - c'est le genre de calcul qu'on
 * recopie de travers a la troisieme reprise.
 */
export function repartitionParMethode(
  paiements: { montant: number | string; methode?: string | null }[]
) {
  const total = paiements.reduce((somme, p) => somme + Number(p.montant), 0);
  if (total === 0) return [];

  const parMethode = new Map<Methode, number>();
  for (const paiement of paiements) {
    const methode = methodeConnue(paiement.methode);
    parMethode.set(
      methode,
      (parMethode.get(methode) ?? 0) + Number(paiement.montant)
    );
  }

  return [...parMethode]
    .map(([methode, montant]) => ({
      methode,
      montant,
      part: (montant / total) * 100,
    }))
    .sort((a, b) => b.montant - a.montant);
}
