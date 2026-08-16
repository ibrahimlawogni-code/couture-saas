import { classes } from "./classes";
import type { TonEtiquette } from "./etiquette";

/*
 * Bloc d'information sur toute la largeur : erreur de formulaire, limite
 * d'offre atteinte, precision sur l'etat du reseau.
 *
 * Les tons reprennent la grammaire des etiquettes. Le role ARIA suit le
 * ton : ce qui signale un probleme est annonce sans attendre, le reste
 * poliment. Sans cela, une erreur de formulaire restait muette pour qui
 * n'a pas les yeux sur l'ecran.
 */

const TONS: Record<Exclude<TonEtiquette, "neutre">, string> = {
  metier: "bg-vert-clair text-foret",
  attention: "bg-ambre-clair text-ambre",
  probleme: "bg-rouge-clair text-rouge",
  systeme: "bg-bleu-clair text-bleu",
};

export function Message({
  ton,
  titre,
  classe,
  children,
}: {
  ton: Exclude<TonEtiquette, "neutre">;
  titre?: string;
  classe?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role={ton === "probleme" ? "alert" : "status"}
      className={classes(
        "rounded-carte px-4 py-3 text-sm",
        "[&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2",
        TONS[ton],
        classe
      )}
    >
      {titre && <p className="font-semibold">{titre}</p>}
      {children && <div className={classes(titre && "mt-1")}>{children}</div>}
    </div>
  );
}
