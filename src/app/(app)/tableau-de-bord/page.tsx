import { Page } from "@/ui/page";
import { TableauDeBord } from "./bord";

export default function TableauDeBordPage() {
  return (
    // Le tableau de bord s'etale sur grand ecran, contrairement aux listes et
    // aux formulaires qui restent en colonne etroite : une ligne de texte
    // trop large se lit mal, un tableau de chiffres non.
    <Page largeur="large">
      <TableauDeBord />
    </Page>
  );
}
