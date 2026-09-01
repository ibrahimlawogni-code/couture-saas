import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { formaterMontant } from "@/lib/commandes";
import type { Traductions } from "@/lib/i18n";
import { OFFRES_PAYANTES, TARIFS } from "@/lib/tarifs";
import { Carte } from "@/ui/carte";
import { Message } from "@/ui/message";
import { EnTeteSection } from "@/ui/page";
import { ouvrirPaiement } from "./actions-abonnement";

/*
 * Ce que l'atelier paie, et de quoi changer d'offre.
 *
 * La duree proposee est d'un mois. Le reste de la chaine en accepte
 * jusqu'a douze, et l'echeance se cumule d'elle-meme ; il n'y a donc rien a
 * reprendre le jour ou un rythme trimestriel sera decide. Ce choix-la
 * s'apprend en encaissant, pas en supposant.
 */

/*
 * Le ton de chaque retour. Les mots, eux, vivent dans le dictionnaire :
 * une couleur ne se traduit pas, une phrase si.
 */
const TONS_RETOUR: Record<string, "metier" | "systeme" | "probleme"> = {
  regle: "metier",
  attente: "systeme",
  indisponible: "probleme",
  offre_inconnue: "probleme",
  duree_invalide: "probleme",
};

/*
 * Rang des offres, pour n'en proposer que le niveau courant et au-dessus.
 *
 * Un atelier sur Pro se voyait proposer « Passer a Atelier » : un versement
 * de 3 500 F qui l'aurait fait redescendre, puisque la fonction en base
 * pose la formule payee. Payer pour perdre des places n'est le souhait de
 * personne, et le proposer n'est pas une commodite mais un piege.
 *
 * Redescendre volontairement reste possible : il suffit de laisser
 * l'echeance passer, et l'entretien nocturne ramene a la formule gratuite
 * sans rien effacer.
 */
const RANGS: Record<string, number> = {
  decouverte: 0,
  atelier: 1,
  atelier_pro: 2,
};

export function Abonnement({
  formule,
  echeance,
  retour,
  mots,
}: {
  formule: string;
  echeance: string | null;
  /** Message rapporte par la route de retour, apres un paiement. */
  retour?: string;
  mots: Traductions;
}) {
  const actuelle = TARIFS[formule];
  const ton = retour ? TONS_RETOUR[retour] : undefined;
  const message =
    retour && ton
      ? mots.reglagesEcran.retours[
          retour as keyof typeof mots.reglagesEcran.retours
        ]
      : undefined;

  return (
    <section className="mt-10">
      <EnTeteSection titre={mots.reglagesEcran.abonnement} />

      {message && ton && (
        <Message ton={ton} titre={message.titre} classe="mt-2">
          {message.texte}
        </Message>
      )}

      <Carte classe="mt-2 p-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-gris">{mots.reglagesEcran.offreActuelle}</span>
          <span className="font-medium text-encre">
            {actuelle?.nom ?? "Découverte"}
          </span>
        </div>

        <p className="mt-1.5 text-xs text-gris">
          {echeance
            ? mots.reglagesEcran.regleeJusquau(
                new Date(echeance).toLocaleDateString(mots.locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              )
            : mots.reglagesEcran.offreGratuite}
        </p>
      </Carte>

      <div className="mt-2 flex flex-col gap-2">
        {OFFRES_PAYANTES.filter(
          (offre) => (RANGS[offre] ?? 0) >= (RANGS[formule] ?? 0)
        ).map((offre) => {
          const tarif = TARIFS[offre];
          const enCours = offre === formule;

          return (
            <form key={offre} action={ouvrirPaiement}>
              <input type="hidden" name="offre" value={offre} />
              <input type="hidden" name="mois" value="1" />

              <button
                type="submit"
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-carte border border-bordure bg-white px-4 text-left transition-colors duration-150 ease-doux hover:border-vert-pale active:bg-papier"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-encre">
                    {enCours
                      ? mots.reglagesEcran.prolonger(tarif.nom)
                      : mots.reglagesEcran.passerA(tarif.nom)}
                  </span>
                  <span className="block text-xs text-gris">
                    {offre === "atelier_pro"
                      ? mots.reglagesEcran.descriptionAtelierPro
                      : mots.reglagesEcran.descriptionAtelier}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-encre">
                    {formaterMontant(tarif.parMois, mots.locale)}
                  </span>
                  <ArrowRight size={15} weight="bold" className="text-gris" />
                </span>
              </button>
            </form>
          );
        })}
      </div>

      {/*
       * Dit avant de cliquer, pas apres. Un tailleur qui laisse expirer son
       * abonnement doit savoir qu'il ne perd rien : c'est la crainte de tout
       * perdre qui fait renoncer a essayer.
       */}
      <p className="mt-2 text-xs leading-relaxed text-gris">
        {mots.reglagesEcran.conditionsPaiement}
      </p>
    </section>
  );
}
