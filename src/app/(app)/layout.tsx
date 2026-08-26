import Link from "next/link";
import { redirect } from "next/navigation";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { Marque } from "../marque";
import { BarreEtatReseau } from "../service-worker";
import { signOut } from "./actions";
import { BarreLaterale } from "./barre-laterale";
import { NavigationPrincipale } from "./navigation";
import { Prechargement } from "./prechargement";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: utilisateur, error } = await supabase
    .from("utilisateurs")
    .select("nom, ateliers(nom)")
    .eq("id", user.id)
    .single();

  /*
   * Compte authentifie mais sans atelier : une inscription par fournisseur
   * externe que l'ecran de bienvenue n'a pas encore achevee (migration
   * 0010). Sans ce renvoi, l'application s'ouvrirait sur un atelier nomme
   * « Mon atelier » et vide de tout, puisque chaque politique RLS compare a
   * un atelier_id qui n'existe pas.
   *
   * Le code d'erreur, et non l'absence de donnees : PGRST116 dit « aucune
   * ligne », la ou une panne passagere ou une coupure reseau laisse aussi
   * utilisateur a null. Renvoyer sur la bienvenue quelqu'un dont la requete
   * a simplement echoue lui ferait croire qu'il a perdu son atelier - et
   * lui proposerait d'en ouvrir un second.
   */
  if (error?.code === "PGRST116") {
    redirect("/bienvenue");
  }

  const atelier = utilisateur?.ateliers as unknown as { nom: string } | null;
  const nomAtelier = atelier?.nom ?? "Mon atelier";
  const nomUtilisateur = utilisateur?.nom ?? "";

  return (
    /*
     * Sur grand ecran, l'application occupe exactement la hauteur de la
     * fenetre et c'est la colonne de contenu qui defile. La page entiere
     * defilait auparavant, ce qui emmenait la barre laterale hors de vue
     * des le premier ecran de commandes.
     */
    <div className="flex min-h-full flex-1 flex-col bg-papier lg:h-dvh lg:flex-row lg:overflow-hidden">
      <BarreLaterale
        nomAtelier={nomAtelier}
        nomUtilisateur={nomUtilisateur}
        deconnexion={signOut}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:overflow-y-auto">
        {/* En-tete du telephone seulement : sur grand ecran, la barre
            laterale porte deja le nom de l'atelier et la deconnexion. */}
        {/*
         * En-tete non collant, volontairement. La bande d'etat du reseau
         * occupe deja le haut de l'ecran en position collante ; deux
         * elements colles a top-0 se recouvrent des le premier defilement,
         * et c'est le plus haut en z qui gagne - la bande, donc, qui
         * masquerait le nom de l'atelier et la deconnexion.
         *
         * C'est la bande qui merite la place : elle dit si le travail part
         * ou reste en attente. L'en-tete ne porte qu'un lien vers les
         * reglages et la deconnexion, dont aucun n'a besoin d'etre a
         * portee permanente.
         */}
        {/*
         * Le calcul plutot que py-3 et pt-securite cote a cote : les deux
         * posent padding-top, et l'utilitaire emis en dernier l'emporte.
         */}
        <header className="flex items-center justify-between gap-3 border-b border-bordure bg-white px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 lg:hidden">
          <Link
            href="/reglages"
            className="-m-1.5 flex min-w-0 items-center gap-2.5 rounded-controle p-1.5 active:bg-papier"
          >
            <span className="shrink-0 text-foret">
              <Marque taille={26} />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1">
                <span className="truncate text-sm font-semibold text-encre">
                  {nomAtelier}
                </span>
                <CaretRight
                  size={12}
                  weight="bold"
                  className="shrink-0 text-gris"
                />
              </span>
              <span className="block truncate text-xs text-gris">
                {nomUtilisateur || "Réglages"}
              </span>
            </span>
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-controle px-3 text-sm font-medium text-gris active:bg-papier"
            >
              Déconnexion
            </button>
          </form>
        </header>

        {/*
         * L'etat du reseau est dit en permanence, sous l'en-tete et non
         * au-dessus : c'est l'en-tete qui porte le nom de l'atelier, et une
         * bande collee au-dessus de lui le poussait hors de l'ecran des le
         * premier defilement.
         */}
        <BarreEtatReseau />

        {/*
         * La reserve du bas vaut la hauteur de la barre d'onglets plus
         * celle de l'indicateur d'accueil de l'iPhone. Une valeur fixe
         * laissait le dernier element de chaque liste sous la barre sur
         * les telephones a encoche.
         */}
        <main className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
      </div>

      <NavigationPrincipale />
      <Prechargement />
    </div>
  );
}
