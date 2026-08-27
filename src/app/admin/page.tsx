import {
  administrateurConnecte,
  listerAdministrateurs,
  listerAteliers,
  lireJournal,
} from "@/lib/admin";
import { plafonds } from "@/lib/formules";
import { Carte } from "@/ui/carte";
import { Etiquette } from "@/ui/etiquette";
import {
  ChangerFormule,
  NommerAdministrateur,
  RevoquerAdministrateur,
} from "./formulaires";

/*
 * L'arriere-guichet est toujours recalcule : il sert a decider, souvent
 * juste apres avoir recu un paiement, et un ecran mis en cache y montrerait
 * une offre qu'on vient de changer soi-meme.
 */
export const dynamic = "force-dynamic";

const dateCourte = (valeur: string | null) =>
  valeur
    ? new Date(valeur).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    : null;

const LIBELLES_ACTION: Record<string, string> = {
  formule: "a changé l'offre de",
  nommer: "a nommé",
  revoquer: "a retiré",
};

export default async function AdminPage() {
  const [moi, ateliers, administrateurs, journal] = await Promise.all([
    administrateurConnecte(),
    listerAteliers(),
    listerAdministrateurs(),
    lireJournal(),
  ]);

  const actifs = ateliers.filter((atelier) => atelier.commandes > 0).length;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-encre">
        Ateliers
      </h1>
      <p className="mt-1 text-sm text-gris">
        {ateliers.length} inscrit{ateliers.length > 1 ? "s" : ""} ·{" "}
        {actifs} avec au moins une commande
      </p>

      <ul className="mt-5 flex flex-col gap-2">
        {ateliers.map((atelier) => (
          <li key={atelier.id}>
            <Carte classe="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-encre">
                      {atelier.nom}
                    </span>
                    {/*
                     * Un atelier orphelin part a la purge trente jours plus
                     * tard. Le signaler ici evite de passer une offre a un
                     * atelier qui n'existera plus le mois prochain.
                     */}
                    {atelier.orphelinDepuis && (
                      <Etiquette ton="probleme">
                        Sans compte depuis le{" "}
                        {dateCourte(atelier.orphelinDepuis)}
                      </Etiquette>
                    )}
                  </p>

                  <p className="chiffres mt-1 text-xs text-gris">
                    {atelier.comptes} compte{atelier.comptes > 1 ? "s" : ""} ·{" "}
                    {atelier.clients} client{atelier.clients > 1 ? "s" : ""} ·{" "}
                    {atelier.commandes} commande
                    {atelier.commandes > 1 ? "s" : ""}
                  </p>

                  <p className="mt-0.5 text-xs text-gris">
                    {atelier.derniereActivite
                      ? `dernière commande le ${dateCourte(atelier.derniereActivite)}`
                      : "aucune commande à ce jour"}
                  </p>
                </div>

                <ChangerFormule
                  atelier={atelier.id}
                  formule={atelier.formule}
                />
              </div>
            </Carte>
          </li>
        ))}
      </ul>

      {/* --- Qui peut administrer -------------------------------------- */}

      <h2 className="mt-10 text-2xl font-semibold tracking-tight text-encre">
        Administrateurs
      </h2>
      <p className="mt-1 text-sm text-gris">
        Ils voient cet écran et peuvent changer l&apos;offre de n&apos;importe
        quel atelier. Chaque geste est consigné plus bas.
      </p>

      <Carte classe="mt-5 p-4">
        <ul className="flex flex-col divide-y divide-bordure">
          {administrateurs.map((administrateur) => (
            <li
              key={administrateur.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-encre">
                  {administrateur.email ?? administrateur.id}
                </p>
                <p className="text-xs text-gris">
                  {administrateur.nom ? `${administrateur.nom} · ` : ""}
                  depuis le {dateCourte(administrateur.depuis)}
                </p>
              </div>

              <RevoquerAdministrateur
                compte={administrateur.id}
                soiMeme={administrateur.id === moi?.id}
              />
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-bordure pt-4">
          <h3 className="text-sm font-medium text-encre">
            Nommer un administrateur
          </h3>
          <NommerAdministrateur />
        </div>
      </Carte>

      {/* --- Ce qui a ete fait ----------------------------------------- */}

      <h2 className="mt-10 text-2xl font-semibold tracking-tight text-encre">
        Journal
      </h2>
      <p className="mt-1 text-sm text-gris">
        Les trente derniers gestes d&apos;administration. C&apos;est ce qui
        rend la délégation tenable.
      </p>

      {journal.length === 0 ? (
        <Carte classe="mt-5 px-4 py-5">
          <p className="text-sm text-gris">
            Rien encore. Chaque changement d&apos;offre et chaque nomination
            viendra s&apos;inscrire ici.
          </p>
        </Carte>
      ) : (
        <Carte classe="mt-5 p-4">
          <ul className="flex flex-col divide-y divide-bordure">
            {journal.map((ligne) => (
              <li key={ligne.id} className="py-2.5 first:pt-0 last:pb-0">
                <p className="text-sm text-encre">
                  <span className="font-medium">
                    {ligne.parEmail ?? "compte supprimé"}
                  </span>{" "}
                  <span className="text-gris">
                    {LIBELLES_ACTION[ligne.action] ?? ligne.action}
                  </span>{" "}
                  <span className="font-medium">
                    {ligne.atelier ?? ligne.cibleEmail ?? "—"}
                  </span>
                  {ligne.action === "formule" && (
                    <span className="text-gris">
                      {" "}
                      : {plafonds(String(ligne.details.avant)).nom} →{" "}
                      {plafonds(String(ligne.details.apres)).nom}
                    </span>
                  )}
                </p>
                <p className="chiffres text-xs text-gris">
                  {new Date(ligne.quand).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </Carte>
      )}
    </>
  );
}
