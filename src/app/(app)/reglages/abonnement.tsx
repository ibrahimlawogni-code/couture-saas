import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { formaterMontant } from "@/lib/commandes";
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

const RETOURS: Record<
  string,
  { ton: "metier" | "systeme" | "probleme"; titre: string; texte: string }
> = {
  regle: {
    ton: "metier",
    titre: "Paiement reçu",
    texte: "Votre offre est à jour. Merci.",
  },
  attente: {
    ton: "systeme",
    titre: "Paiement en cours de traitement",
    texte:
      "Votre versement est bien parti. L'offre se met à jour d'elle-même, en général en quelques secondes. Rien à refaire de votre côté.",
  },
  indisponible: {
    ton: "probleme",
    titre: "Paiement indisponible",
    texte:
      "La page de paiement n'a pas pu s'ouvrir. Réessayez dans un moment ; rien n'a été débité.",
  },
  offre_inconnue: {
    ton: "probleme",
    titre: "Offre inconnue",
    texte: "Cette offre n'existe pas. Reprenez depuis cet écran.",
  },
  duree_invalide: {
    ton: "probleme",
    titre: "Durée invalide",
    texte: "La durée demandée n'est pas acceptée. Reprenez depuis cet écran.",
  },
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
}: {
  formule: string;
  echeance: string | null;
  /** Message rapporte par la route de retour, apres un paiement. */
  retour?: string;
}) {
  const actuelle = TARIFS[formule];
  const message = retour ? RETOURS[retour] : undefined;

  return (
    <section className="mt-10">
      <EnTeteSection titre="Abonnement" />

      {message && (
        <Message ton={message.ton} titre={message.titre} classe="mt-2">
          {message.texte}
        </Message>
      )}

      <Carte classe="mt-2 p-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-gris">Offre actuelle</span>
          <span className="font-medium text-encre">
            {actuelle?.nom ?? "Découverte"}
          </span>
        </div>

        <p className="mt-1.5 text-xs text-gris">
          {echeance
            ? `Réglée jusqu'au ${new Date(echeance).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}.`
            : "Gratuite, sans limite de durée. Cinq clients et cinq commandes en cours."}
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
                    {enCours ? `Prolonger ${tarif.nom}` : `Passer à ${tarif.nom}`}
                  </span>
                  <span className="block text-xs text-gris">
                    {offre === "atelier_pro"
                      ? "Clients et commandes sans limite, jusqu'à 5 apprentis"
                      : "Clients et commandes sans limite, un seul compte"}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-encre">
                    {formaterMontant(tarif.parMois)}
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
        Paiement par Mobile Money, un mois à la fois, sans engagement. À
        l&apos;échéance l&apos;atelier revient à l&apos;offre gratuite : vos
        clients, commandes et mesures sont conservés, vous ne pouvez
        simplement plus en ajouter au-delà des limites de Découverte.
      </p>
    </section>
  );
}
