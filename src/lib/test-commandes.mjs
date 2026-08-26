/*
 * Banc d'essai des regles de commande.
 *
 * Deux calculs y sont verifies, choisis parce qu'ils manipulent des dates
 * et que personne ne voit une erreur de date en relisant du code :
 *
 *   ponctualite     le seul chiffre du produit qui juge le travail plutot
 *                   que l'argent, et le seul qu'un tailleur puisse montrer
 *                   a un client. Une erreur ici se raconte a voix haute.
 *   groupeEcheance  il commande la mise en page entiere de l'ecran des
 *                   commandes. Un decalage d'un jour range une piece a
 *                   livrer aujourd'hui sous « Cette semaine », ou l'inverse.
 *
 * S'y ajoute la repartition des encaissements par moyen de paiement, qui
 * n'est pas une affaire de date mais d'argent - et qui doit tenir debout
 * sur les versements anterieurs a la saisie du moyen, ceux qui n'en
 * portent aucun.
 *
 *   npm run test:commandes
 *
 * Il vit a cote de ce qu'il verifie, comme le banc des migrations vit dans
 * supabase/. Pas de bibliotheque : quelques dizaines de comparaisons ne
 * valent pas une dependance de plus dans un projet qui vise l'Android
 * d'entree de gamme.
 */
import { groupeEcheance, ponctualite } from "./commandes.ts";
import { repartitionParMethode } from "./paiements.ts";

let total = 0;
let rates = 0;

function verifier(intitule, obtenu, attendu) {
  total += 1;
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (!ok) rates += 1;
  console.log(
    `  ${ok ? "ok  " : "RATE"}  ${intitule}` +
      (ok
        ? ""
        : `\n          obtenu ${JSON.stringify(obtenu)}, attendu ${JSON.stringify(attendu)}`)
  );
}

const commande = (id, date_livraison, statut = "livre") => ({
  id,
  statut,
  date_livraison,
});
const sortie = (commande_id, created_at) => ({ commande_id, created_at });

// =========================================================================
console.log("\nA. Ponctualite\n");
// =========================================================================

verifier(
  "A1 livree le jour promis",
  ponctualite([commande("a", "2026-08-10")], [sortie("a", "2026-08-10T16:00:00Z")]),
  { mesurees: 1, aTemps: 1, part: 100, retardMoyen: 0 }
);

verifier(
  "A2 livree en avance",
  ponctualite([commande("a", "2026-08-10")], [sortie("a", "2026-08-07T09:00:00Z")]),
  { mesurees: 1, aTemps: 1, part: 100, retardMoyen: 0 }
);

verifier(
  "A3 livree trois jours trop tard",
  ponctualite([commande("a", "2026-08-10")], [sortie("a", "2026-08-13T09:00:00Z")]),
  { mesurees: 1, aTemps: 0, part: 0, retardMoyen: 3 }
);

/*
 * Sans date promise, la commande sort du calcul. Les compter comme
 * ponctuelles gonflerait le score de tout ce qu'on a oublie de dater.
 */
verifier(
  "A4 sans date de livraison prevue : ecartee",
  ponctualite([commande("a", null)], [sortie("a", "2026-08-13T09:00:00Z")]),
  { mesurees: 0, aTemps: 0, part: null, retardMoyen: 0 }
);

verifier(
  "A5 livree sans trace datee : ecartee",
  ponctualite([commande("a", "2026-08-10")], []),
  { mesurees: 0, aTemps: 0, part: null, retardMoyen: 0 }
);

verifier(
  "A6 commande encore en cours : ecartee",
  ponctualite(
    [commande("a", "2026-08-10", "couture")],
    [sortie("a", "2026-08-13T09:00:00Z")]
  ),
  { mesurees: 0, aTemps: 0, part: null, retardMoyen: 0 }
);

/*
 * Le bandeau d'annulation de l'ecran des commandes permet de revenir sur
 * un passage a « Livre ». L'historique garde alors deux lignes, et c'est
 * la seconde qui fait foi.
 */
verifier(
  "A7 deux passages a Livre : le dernier fait foi",
  ponctualite(
    [commande("a", "2026-08-10")],
    [sortie("a", "2026-08-09T09:00:00Z"), sortie("a", "2026-08-14T09:00:00Z")]
  ),
  { mesurees: 1, aTemps: 0, part: 0, retardMoyen: 4 }
);

/*
 * Un atelier neuf n'affiche pas « 0 % » mais rien du tout : une absence de
 * mesure n'est pas un mauvais score.
 */
verifier("A8 atelier sans historique : aucune mesure", ponctualite([], []), {
  mesurees: 0,
  aTemps: 0,
  part: null,
  retardMoyen: 0,
});

verifier(
  "A9 trois a temps sur quatre",
  ponctualite(
    [
      commande("a", "2026-08-01"),
      commande("b", "2026-08-02"),
      commande("c", "2026-08-03"),
      commande("d", "2026-08-04"),
    ],
    [
      sortie("a", "2026-08-01T10:00:00Z"),
      sortie("b", "2026-07-31T10:00:00Z"),
      sortie("c", "2026-08-03T10:00:00Z"),
      sortie("d", "2026-08-06T10:00:00Z"),
    ]
  ),
  { mesurees: 4, aTemps: 3, part: 75, retardMoyen: 2 }
);

// Le retard moyen porte sur les seules pieces en retard, pas sur toutes :
// le diluer sur les livraisons reussies le rendrait illisible.
verifier(
  "A10 retard moyen calcule sur les retards seuls",
  ponctualite(
    [
      commande("a", "2026-08-01"),
      commande("b", "2026-08-02"),
      commande("c", "2026-08-03"),
    ],
    [
      sortie("a", "2026-08-01T10:00:00Z"),
      sortie("b", "2026-08-04T10:00:00Z"),
      sortie("c", "2026-08-09T10:00:00Z"),
    ]
  ),
  { mesurees: 3, aTemps: 1, part: 33, retardMoyen: 4 }
);

// =========================================================================
console.log("\nB. Groupes d'echeance\n");
// =========================================================================

/*
 * Les dates sont posees par rapport a aujourd'hui, comme la fonction les
 * lit. Un banc qui figerait une date serait vrai le jour de son ecriture
 * et faux le lendemain.
 */
const dans = (jours) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + jours);
  return date.toISOString().slice(0, 10);
};

verifier("B1 hier : en retard", groupeEcheance(dans(-1), "couture"), "en_retard");
verifier("B2 aujourd hui", groupeEcheance(dans(0), "couture"), "aujourdhui");
verifier("B3 demain : cette semaine", groupeEcheance(dans(1), "couture"), "cette_semaine");

// Sept jours glissants, et non la semaine calendaire : un vendredi, ce qui
// interesse le tailleur est ce qui sort d'ici jeudi prochain.
verifier("B4 dans sept jours : encore cette semaine", groupeEcheance(dans(7), "couture"), "cette_semaine");
verifier("B5 dans huit jours : plus tard", groupeEcheance(dans(8), "couture"), "plus_tard");

verifier("B6 sans date", groupeEcheance(null, "couture"), "sans_date");

/*
 * Livre l'emporte sur tout le reste, y compris sur un retard. Une piece
 * remise n'est plus un probleme, meme si elle est sortie en retard - c'est
 * la ponctualite qui garde ce souvenir, pas la liste du jour.
 */
verifier("B7 livree en retard : rangee dans Livre", groupeEcheance(dans(-30), "livre"), "livre");
verifier("B8 livree sans date : rangee dans Livre", groupeEcheance(null, "livre"), "livre");

// =========================================================================
console.log("\nC. Repartition par moyen de paiement\n");
// =========================================================================

const verse = (montant, methode) => ({ montant, methode });

verifier("C1 aucun versement", repartitionParMethode([]), []);

verifier(
  "C2 un seul moyen : cent pour cent",
  repartitionParMethode([verse(1000, "especes"), verse(3000, "especes")]),
  [{ methode: "especes", montant: 4000, part: 100 }]
);

// Le plus gros d'abord : c'est l'ordre dans lequel on lit une repartition.
verifier(
  "C3 trie du plus gros au plus petit",
  repartitionParMethode([
    verse(1000, "especes"),
    verse(6000, "mobile_money"),
    verse(3000, "virement"),
  ]),
  [
    { methode: "mobile_money", montant: 6000, part: 60 },
    { methode: "virement", montant: 3000, part: 30 },
    { methode: "especes", montant: 1000, part: 10 },
  ]
);

/*
 * Les versements enregistres avant que l'application ne saisisse le moyen
 * n'en portent aucun. Ils doivent retomber sur especes - la valeur que la
 * base leur a posee par defaut - et non disparaitre de la somme.
 */
verifier(
  "C4 moyen absent : compte en especes",
  repartitionParMethode([verse(2000, null), verse(2000, undefined)]),
  [{ methode: "especes", montant: 4000, part: 100 }]
);

verifier(
  "C5 moyen inconnu : compte en especes",
  repartitionParMethode([verse(500, "bitcoin")]),
  [{ methode: "especes", montant: 500, part: 100 }]
);

// Un total a zero ne doit pas produire une division par zero.
verifier("C6 total nul", repartitionParMethode([verse(0, "especes")]), []);

// Les montants arrivent parfois en texte depuis la base.
verifier(
  "C7 montants en texte",
  repartitionParMethode([verse("1500", "especes"), verse("500", "virement")]),
  [
    { methode: "especes", montant: 1500, part: 75 },
    { methode: "virement", montant: 500, part: 25 },
  ]
);

// =========================================================================
console.log(
  `\n${rates === 0 ? `Les ${total} verifications passent.` : `${rates} verification(s) sur ${total} en echec.`}\n`
);
process.exit(rates === 0 ? 0 : 1);
