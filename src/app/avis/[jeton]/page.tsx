import type { Metadata } from "next";
import { CheckCircle, LinkBreak } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { Marque } from "../../marque";
import { FormulaireAvis } from "./formulaire";

/*
 * Jamais indexee. Un lien de notation porte un jeton : le laisser entrer
 * dans un moteur de recherche reviendrait a publier de quoi noter a la
 * place du client.
 */
export const metadata: Metadata = {
  title: "Votre avis",
  robots: { index: false, follow: false },
};

/** Un jeton mal forme ferait echouer la fonction au lieu de rendre vide. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Commande = { atelier: string; modele: string | null; deja_note: boolean };

export default async function PageAvis({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;

  let commande: Commande | null = null;

  if (UUID.test(jeton)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("commande_a_noter", { jeton });
    commande = (Array.isArray(data) ? data[0] : null) ?? null;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-papier px-4 py-10">
      <div className="w-full max-w-md">
        <span className="mx-auto flex w-fit items-center gap-2 text-foret">
          <Marque taille={26} />
          <span className="text-lg font-semibold tracking-tight">TailorHub</span>
        </span>

        <div className="mt-6 rounded-panneau border border-bordure bg-white p-6 shadow-carte sm:p-8">
          {!commande ? (
            <Etat
              icone={LinkBreak}
              titre="Ce lien n'est plus valable"
              texte="Il a peut-être expiré, ou la commande n'a pas encore été remise. Vous pouvez fermer cette page."
            />
          ) : commande.deja_note ? (
            <Etat
              icone={CheckCircle}
              titre="Merci, c'est déjà fait"
              texte="Votre avis a bien été enregistré. Il ne peut être donné qu'une fois par commande."
            />
          ) : (
            <FormulaireAvis
              jeton={jeton}
              atelier={commande.atelier}
              modele={commande.modele}
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gris">
          Votre nom n&apos;apparaît pas. Seul l&apos;atelier voit cet avis.
        </p>
      </div>
    </main>
  );
}

function Etat({
  icone: Icone,
  titre,
  texte,
}: {
  icone: React.ComponentType<{ size?: number; weight?: "fill"; className?: string }>;
  titre: string;
  texte: string;
}) {
  return (
    <div className="text-center">
      <Icone size={36} weight="fill" className="mx-auto text-vert" />
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-encre">
        {titre}
      </h1>
      <p className="mt-2 leading-relaxed text-gris">{texte}</p>
    </div>
  );
}
