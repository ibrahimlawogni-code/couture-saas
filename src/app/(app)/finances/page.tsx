import { EnTetePage, Page } from "@/ui/page";
import { BilanFinancier } from "./bilan";

export default function FinancesPage() {
  return (
    <Page>
      <EnTetePage titre="Finances" />
      <BilanFinancier />
    </Page>
  );
}
