import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUT_LABELS, formaterMontant, type Statut } from "@/lib/commandes";

type CommandeFinance = {
  id: string;
  nom_modele: string | null;
  statut: string;
  prix_total: number;
  created_at: string;
  clients: unknown;
};

function debutDuMois() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default async function FinancesPage() {
  const supabase = await createClient();

  const [{ data: commandes }, { data: paiements }] = await Promise.all([
    supabase
      .from("commandes")
      .select("id, nom_modele, statut, prix_total, created_at, clients(nom)"),
    supabase.from("paiements").select("commande_id, montant, type, created_at"),
  ]);

  const listeCommandes = (commandes ?? []) as CommandeFinance[];
  const listePaiements = paiements ?? [];

  const debutMois = debutDuMois();
  const estDeCeMois = (date: string) => new Date(date) >= debutMois;

  const encaisseMois = listePaiements
    .filter((paiement) => estDeCeMois(paiement.created_at))
    .reduce((somme, paiement) => somme + Number(paiement.montant), 0);

  const acomptesMois = listePaiements
    .filter(
      (paiement) => paiement.type === "acompte" && estDeCeMois(paiement.created_at)
    )
    .reduce((somme, paiement) => somme + Number(paiement.montant), 0);

  const commandesMois = listeCommandes.filter((commande) =>
    estDeCeMois(commande.created_at)
  );
  const valeurCommandesMois = commandesMois.reduce(
    (somme, commande) => somme + Number(commande.prix_total),
    0
  );

  // Ce qui reste du sur chaque commande, livree ou non : une commande
  // remise sans solde reste une creance.
  const verseParCommande = new Map<string, number>();
  for (const paiement of listePaiements) {
    verseParCommande.set(
      paiement.commande_id,
      (verseParCommande.get(paiement.commande_id) ?? 0) + Number(paiement.montant)
    );
  }

  const impayes = listeCommandes
    .map((commande) => ({
      ...commande,
      reste:
        Number(commande.prix_total) - (verseParCommande.get(commande.id) ?? 0),
    }))
    .filter((commande) => commande.reste > 0)
    .sort((a, b) => b.reste - a.reste);

  const totalCreances = impayes.reduce((somme, commande) => somme + commande.reste, 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <h1 className="text-xl font-semibold text-zinc-900">Finances</h1>
      <p className="text-sm text-zinc-500">
        Mois de{" "}
        {debutMois.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
      </p>

      <section className="mt-4 rounded-xl bg-zinc-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-400">
          Encaisse ce mois
        </p>
        <p className="mt-1 text-3xl font-semibold">{formaterMontant(encaisseMois)}</p>
        <p className="mt-1 text-sm text-zinc-400">
          dont {formaterMontant(acomptesMois)} d&apos;acomptes
        </p>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Commandes du mois
          </p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {formaterMontant(valeurCommandesMois)}
          </p>
          <p className="text-sm text-zinc-500">
            {commandesMois.length} commande{commandesMois.length > 1 ? "s" : ""}
          </p>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Creances en attente
          </p>
          <p
            className={`mt-1 text-xl font-semibold ${
              totalCreances > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {formaterMontant(totalCreances)}
          </p>
          <p className="text-sm text-zinc-500">
            {impayes.length} commande{impayes.length > 1 ? "s" : ""}
          </p>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          A recouvrer
        </h2>
        {impayes.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Aucun impaye, tout est solde.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {impayes.map((commande) => {
              const client = commande.clients as { nom: string } | null;

              return (
                <li key={commande.id}>
                  <Link
                    href={`/commandes/${commande.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm active:bg-zinc-100"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {client?.nom ?? "Client inconnu"}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {commande.nom_modele ?? "Sans modele"} ·{" "}
                        {STATUT_LABELS[commande.statut as Statut]}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-red-600">
                      {formaterMontant(commande.reste)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
