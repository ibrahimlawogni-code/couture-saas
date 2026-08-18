import { Carte } from "./carte";

/*
 * Un libelle, une valeur, et ce qui lui donne son sens.
 *
 * Elle etait definie trois fois - tableau de bord, finances, fiche client
 * - dont deux au retour a la ligne pres. Le commentaire de la troisieme
 * disait meme qu'elle etait « alignee sur celles du tableau de bord » :
 * un alignement tenu a la main, et deja rompu sur deux valeurs.
 *
 * La precision n'est pas decorative. « Creances 216 000 » ne dit pas s'il
 * s'agit d'un gros impaye ou de dix petits, et c'est pourtant ce qui
 * decide de la matinee.
 *
 * Chiffres proportionnels, jamais tabulaires : la chasse fixe donne a
 * chaque chiffre la largeur d'un zero, ce qui distend visiblement une
 * valeur isolee de cette taille. Elle est reservee aux colonnes de
 * nombres qui doivent s'aligner les uns sous les autres.
 */
export function Vignette({
  libelle,
  valeur,
  unite,
  precision,
  alerte = false,
  taille = "normal",
}: {
  libelle: string;
  valeur: string;
  /** Devise ou unite, posee en retrait : elle se repete a chaque lecture. */
  unite?: string;
  precision?: string;
  /** Passe la valeur en rouge : une somme due, un retard. */
  alerte?: boolean;
  /** « compacte » pour ce qui ne supporte pas la grande taille, une date. */
  taille?: "normal" | "compacte";
}) {
  return (
    <Carte classe={taille === "compacte" ? "p-3" : "p-3.5"}>
      <p className="text-[10px] font-medium tracking-[0.1em] text-gris uppercase">
        {libelle}
      </p>

      {/*
       * Le repli est necessaire, pas decoratif. Sur trois colonnes a
       * 390 px, une vignette fait un tiers de l'ecran : « 216 000 » suivi
       * de « FCFA » sur la meme ligne debordait de la carte. La devise
       * passe donc dessous quand la place manque, plutot que de sortir du
       * cadre.
       */}
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1">
        <span
          className={`leading-none font-semibold tracking-tight ${
            taille === "compacte" ? "text-base" : "text-lg sm:text-2xl"
          } ${alerte ? "text-rouge" : "text-encre"}`}
        >
          {valeur}
        </span>
        {unite && <span className="text-[10px] font-medium text-gris">{unite}</span>}
      </p>

      {precision && (
        <p className="mt-1.5 text-[11px] leading-tight text-gris">{precision}</p>
      )}
    </Carte>
  );
}
