import {
  STATUTS,
  STATUT_LABELS,
  rangStatut,
  type Statut,
} from "@/lib/commandes";
import { classes } from "./classes";

/**
 * L'avancement d'une commande, en sept traits.
 *
 * C'est ce qui remplace les sept colonnes du Kanban : la chaine reste
 * entierement lisible, mais elle tient dans une ligne de liste au lieu de
 * commander la mise en page de l'ecran. Sur un telephone de 390 px, sept
 * colonnes n'en laissaient voir qu'une et demie.
 *
 * Le trait de l'etape courante est plus large et plus sombre. Sans lui, il
 * fallait compter les traits pour situer la piece ; avec lui, la position
 * se lit sans compter, ce qui est tout l'interet d'un graphique.
 *
 * role="img" avec un libelle : sept traits ne veulent rien dire pour qui ne
 * les voit pas, et le nom de l'etape courante n'est pas toujours ecrit a
 * cote - le bouton d'a cote porte celui de l'etape suivante.
 */
export function Jalons({
  statut,
  classe,
}: {
  statut: Statut;
  classe?: string;
}) {
  const rang = rangStatut(statut);

  return (
    <span
      role="img"
      aria-label={`Étape ${rang + 1} sur ${STATUTS.length} : ${STATUT_LABELS[statut]}`}
      className={classes("flex shrink-0 items-center gap-[0.15625rem]", classe)}
    >
      {STATUTS.map((etape, n) => (
        <span
          key={etape}
          className={classes(
            "h-1 rounded-sm",
            n === rang ? "w-3.5 bg-foret" : "w-1.5",
            n < rang && "bg-vert",
            n > rang && "bg-bordure"
          )}
        />
      ))}
    </span>
  );
}

/**
 * La repartition de l'atelier sur les six etapes en cours, en une barre.
 *
 * Elle repond a « ou en est l'atelier » d'un seul coup d'oeil - la question
 * a laquelle le Kanban repondait en occupant tout l'ecran. Livre en est
 * exclu : une piece remise n'est plus dans l'atelier, et la garder ecrasait
 * les six autres etapes des la deuxieme semaine d'usage.
 *
 * La rampe de verts ne vient pas des tokens : ce n'est pas une couleur qui
 * veut dire quelque chose, c'est une progression. Les tokens portent un
 * sens, et une nuance intermediaire n'en porte aucun.
 */
const RAMPE = ["#dcede5", "#bfdfd0", "#9fcfba", "#6fb397", "#3f9375", "#12684e"];

export function Repartition({ parEtape }: { parEtape: Record<string, number> }) {
  const etapes = STATUTS.filter((statut) => statut !== "livre");
  const total = etapes.reduce((somme, etape) => somme + (parEtape[etape] ?? 0), 0);

  if (total === 0) return null;

  return (
    <div>
      <div
        aria-hidden
        className="flex h-3.5 gap-[0.1875rem] overflow-hidden rounded-full"
      >
        {etapes.map((etape, n) => {
          const nombre = parEtape[etape] ?? 0;
          if (nombre === 0) return null;

          return (
            <div
              key={etape}
              style={{
                width: `${(nombre / total) * 100}%`,
                background: RAMPE[n],
              }}
            />
          );
        })}
      </div>

      {/*
       * Les chiffres portent l'information, la barre n'en est que le
       * dessin : ils restent lisibles quand elle est masquee.
       *
       * Le libelle est empile sous son chiffre, et non pose a cote. Sur
       * 390 px, six colonnes n'offrent que 55 px chacune : « 2 Couture »
       * debordait sur le chiffre suivant, et « Essayage » tombait a la
       * ligne en emportant l'alignement de toute la rangee.
       */}
      <div className="mt-2.5 flex">
        {etapes.map((etape) => (
          <div key={etape} className="min-w-0 flex-1">
            <div className="chiffres text-sm leading-tight font-semibold text-encre">
              {parEtape[etape] ?? 0}
            </div>
            <div className="truncate text-[0.625rem] text-gris">
              {etape === "pret" ? "Prêt" : STATUT_LABELS[etape]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
