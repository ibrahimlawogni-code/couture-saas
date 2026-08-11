import { TableauDeBord } from "./bord";

export default function TableauDeBordPage() {
  return (
    // Le tableau de bord s'etale sur grand ecran, contrairement aux listes et
    // aux formulaires qui restent en colonne etroite : une ligne de texte
    // trop large se lit mal, un tableau de chiffres non.
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 lg:max-w-5xl lg:px-8">
      <TableauDeBord />
    </div>
  );
}
