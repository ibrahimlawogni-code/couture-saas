import { BilanFinancier } from "./bilan";

export default function FinancesPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <h1 className="text-xl font-semibold text-encre">Finances</h1>
      <BilanFinancier />
    </div>
  );
}
