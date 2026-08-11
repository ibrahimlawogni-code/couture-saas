"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useFileAttente } from "@/lib/offline/use-file-attente";

export type Membre = { id: string; nom: string; role: string };
export type Invitation = { id: string; code: string; expire_le: string };

// Sans I, O, 0 ni 1 : un code se dicte au telephone ou se recopie a la main.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genererCode() {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(6)),
    (octet) => ALPHABET[octet % ALPHABET.length]
  ).join("");
}

export function Equipe({
  atelierId,
  utilisateurId,
  estProprietaire,
  membres,
  invitations,
  places,
}: {
  atelierId: string;
  utilisateurId: string;
  estProprietaire: boolean;
  membres: Membre[];
  invitations: Invitation[];
  places: number;
}) {
  const router = useRouter();
  const { horsLigne } = useFileAttente();
  const [occupe, setOccupe] = useState(false);
  const [copie, setCopie] = useState<string | null>(null);

  const occupees = membres.length + invitations.length;
  const complet = occupees >= places;

  const inviter = useCallback(async () => {
    setOccupe(true);
    const supabase = createClient();

    await supabase.from("invitations").insert({
      atelier_id: atelierId,
      code: genererCode(),
      role: "apprenti",
      cree_par: utilisateurId,
    });

    setOccupe(false);
    router.refresh();
  }, [atelierId, utilisateurId, router]);

  async function annuler(id: string) {
    setOccupe(true);
    const supabase = createClient();
    await supabase.from("invitations").delete().eq("id", id);
    setOccupe(false);
    router.refresh();
  }

  async function retirer(id: string) {
    setOccupe(true);
    const supabase = createClient();
    await supabase.from("utilisateurs").delete().eq("id", id);
    setOccupe(false);
    router.refresh();
  }

  async function copier(code: string) {
    await navigator.clipboard.writeText(code);
    setCopie(code);
    setTimeout(() => setCopie(null), 2500);
  }

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gris">
          Atelier
        </h2>
        <span className="text-xs text-gris">
          {occupees} place{occupees > 1 ? "s" : ""} sur {places}
        </span>
      </div>

      <ul className="mt-2 flex flex-col gap-2">
        {membres.map((membre) => (
          <li
            key={membre.id}
            className="flex items-center justify-between gap-3 rounded-3xl bg-white px-4 py-3.5 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-encre">{membre.nom}</p>
              <p className="text-xs text-gris">
                {membre.role === "proprietaire" ? "Propriétaire" : "Apprenti"}
                {membre.id === utilisateurId ? " · vous" : ""}
              </p>
            </div>
            {estProprietaire && membre.id !== utilisateurId && (
              <button
                type="button"
                onClick={() => retirer(membre.id)}
                disabled={occupe || horsLigne}
                className="shrink-0 rounded-2xl px-3 py-2 text-xs font-medium text-rouge active:bg-rouge-clair disabled:opacity-40"
              >
                Retirer
              </button>
            )}
          </li>
        ))}

        {invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="flex items-center justify-between gap-3 rounded-3xl border border-dashed border-bordure bg-white px-4 py-3.5"
          >
            <div className="min-w-0">
              <p className="font-mono text-base font-semibold tracking-[0.25em] text-encre">
                {invitation.code}
              </p>
              <p className="text-xs text-gris">
                En attente · expire le{" "}
                {new Date(invitation.expire_le).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => copier(invitation.code)}
                className="rounded-2xl px-3 py-2 text-xs font-medium text-vert active:bg-vert-clair"
              >
                {copie === invitation.code ? "Copié" : "Copier"}
              </button>
              {estProprietaire && (
                <button
                  type="button"
                  onClick={() => annuler(invitation.id)}
                  disabled={occupe || horsLigne}
                  className="rounded-2xl px-3 py-2 text-xs font-medium text-gris active:bg-papier disabled:opacity-40"
                >
                  Annuler
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {estProprietaire && (
        <>
          <button
            type="button"
            onClick={inviter}
            disabled={occupe || horsLigne || complet}
            className="mt-3 w-full rounded-2xl border border-bordure bg-white px-4 py-3.5 text-sm font-medium text-encre active:bg-papier disabled:opacity-40"
          >
            {complet ? "Toutes les places sont prises" : "Inviter un apprenti"}
          </button>

          <p className="mt-2 text-xs text-gris">
            {complet
              ? "Retirez un compte ou une invitation pour libérer une place."
              : "Un code est généré. Transmettez-le à votre apprenti : il le saisira en créant son compte."}
          </p>
        </>
      )}
    </section>
  );
}
