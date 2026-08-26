"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRight, SignOut } from "@phosphor-icons/react/dist/ssr";
import { plafonds } from "@/lib/formules";
import { useDonnees } from "@/lib/offline/use-donnees";
import { useEtatEnvoi } from "@/lib/offline/use-etat-envoi";
import { Marque } from "../marque";
import { ONGLETS } from "./onglets";

/*
 * Les trois tons de l'etat d'envoi, poses sur l'aplat foret.
 *
 * Les couleurs vives de la palette y disparaissent : le bleu systeme
 * (#1b4f72) sur le vert foret (#0c3b2e) donne 1,3:1, illisible. Ce sont
 * donc les teintes claires de chaque famille qui portent le texte, comme
 * le vert pale le fait deja pour le texte secondaire.
 */
const TONS_ETAT = {
  calme: "text-vert-pale",
  systeme: "text-bleu-clair",
  probleme: "text-rouge-clair",
} as const;

const POINTS_ETAT = {
  calme: "bg-vert-pale",
  systeme: "bg-bleu-clair",
  probleme: "bg-rouge-clair",
} as const;

/**
 * Navigation de grand ecran. Le telephone garde sa barre du bas : une
 * colonne laterale y mangerait un tiers de la largeur utile.
 *
 * Elle est passee de 256 a 200 px - 14 % d'un ecran de 1440 au lieu de
 * 18 %. Elle ne porte que quatre entrees, et le bas de la colonne restait
 * vide sur toute sa moitie inferieure : la largeur qu'elle prenait n'etait
 * justifiee ni par son contenu, ni par sa densite.
 */
export function BarreLaterale({
  nomAtelier,
  nomUtilisateur,
  deconnexion,
}: {
  nomAtelier: string;
  nomUtilisateur: string;
  deconnexion: () => void;
}) {
  const pathname = usePathname();
  const { atelier } = useDonnees();
  const etat = useEtatEnvoi();

  const formule = plafonds(atelier?.formule).nom;

  return (
    // sur-fond-sombre bascule l'anneau de focus en blanc : le vert de
    // l'anneau par defaut se perd dans le vert forêt du fond.
    <aside className="sur-fond-sombre hidden w-50 shrink-0 flex-col bg-foret p-3 text-white lg:flex">
      <Link
        href="/tableau-de-bord"
        className="flex items-center gap-2 rounded-controle px-2 py-1.5"
      >
        <Marque taille={24} />
        <span className="text-base font-semibold tracking-tight">TailorHub</span>
      </Link>

      {/*
       * L'atelier est un raccourci vers les reglages, mais rien ne le
       * disait : ni fleche, ni changement au survol. Il ressemblait a une
       * simple etiquette, et l'ecran Reglages restait introuvable sur
       * grand ecran ou aucun onglet ne le porte.
       */}
      <Link
        href="/reglages"
        aria-current={pathname.startsWith("/reglages") ? "page" : undefined}
        className={`mt-5 flex items-center gap-1.5 rounded-carte px-2.5 py-2.5 transition-colors duration-150 ease-doux ${
          pathname.startsWith("/reglages")
            ? "bg-white/15"
            : "bg-white/[0.07] hover:bg-white/15"
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{nomAtelier}</span>
          <span className="block truncate text-xs text-vert-pale">
            {nomUtilisateur || "Réglages"}
          </span>
        </span>
        <CaretRight size={13} weight="bold" className="shrink-0 text-vert-pale" />
      </Link>

      <nav aria-label="Navigation principale" className="mt-5 flex flex-col gap-0.5">
        {ONGLETS.map(({ href, label, icone: Icone }) => {
          const actif = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-controle px-2.5 py-2.5 text-sm font-medium transition-colors duration-150 ease-doux ${
                actif
                  ? "bg-white text-foret"
                  : "text-vert-pale hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icone size={18} weight={actif ? "fill" : "regular"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/*
       * Le bas de la colonne porte maintenant ce qu'on va chercher ailleurs
       * plutot que du vide : l'etat d'envoi, qui n'etait dit nulle part sur
       * grand ecran puisque la bande du telephone y est masquee, et la
       * formule, qu'il fallait ouvrir les reglages pour connaitre.
       */}
      <div className="mt-auto flex flex-col gap-0.5 border-t border-white/10 pt-3">
        <p
          role="status"
          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs ${TONS_ETAT[etat.ton]}`}
        >
          <span
            className={`size-1.5 shrink-0 rounded-full ${POINTS_ETAT[etat.ton]}`}
          />
          <span className="min-w-0 truncate">
            {etat.texte}
            {etat.detail ? ` · ${etat.detail}` : ""}
          </span>
        </p>

        {formule && (
          <Link
            href="/reglages"
            className="rounded-controle px-2.5 py-1.5 text-xs text-vert-pale transition-colors duration-150 ease-doux hover:text-white"
          >
            Offre {formule}
          </Link>
        )}

        <form action={deconnexion}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-controle px-2.5 py-2 text-left text-sm font-medium text-vert-pale transition-colors duration-150 ease-doux hover:bg-white/10 hover:text-white"
          >
            <SignOut size={18} />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
