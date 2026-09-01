"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, UserPlus } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { useTraductions } from "@/lib/offline/use-traductions";
import { Bouton } from "@/ui/bouton";
import { Carte } from "@/ui/carte";
import { EnTeteSection } from "@/ui/page";

export type Membre = { id: string; nom: string; role: string };
export type Invitation = { id: string; code: string; expire_le: string };

// Sans I, O, 0 ni 1 : un code se dicte au telephone ou se recopie a la main.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const DELAI_CONFIRMATION_MS = 5000;

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
  const mots = useTraductions();
  const [copie, setCopie] = useState<string | null>(null);
  /*
   * Retirer un compte effacait la ligne au premier appui, sans rien
   * demander. C'est la seule action irreversible de l'application, et
   * elle etait a un doigt d'un bouton « Copier ». Le premier appui
   * demande maintenant confirmation, et la demande retombe seule.
   */
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);

  useEffect(() => {
    if (!aConfirmer) return;
    const minuterie = setTimeout(() => setAConfirmer(null), DELAI_CONFIRMATION_MS);
    return () => clearTimeout(minuterie);
  }, [aConfirmer]);

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
    setAConfirmer(null);
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
      <EnTeteSection
        titre={mots.reglagesEcran.equipe}
        action={
          <span className="chiffres text-xs text-gris">
            {mots.reglagesEcran.places(occupees, places)}
          </span>
        }
      />

      <ul className="mt-2 flex flex-col gap-2">
        {membres.map((membre) => (
          <li key={membre.id}>
            <Carte classe="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-encre">
                  {membre.nom}
                </span>
                <span className="block text-xs text-gris">
                  {membre.role === "proprietaire"
                    ? mots.reglagesEcran.proprietaire
                    : mots.reglagesEcran.apprenti}
                  {membre.id === utilisateurId ? " · vous" : ""}
                </span>
              </span>

              {estProprietaire && membre.id !== utilisateurId && (
                <Bouton
                  type="button"
                  taille="compact"
                  allure={aConfirmer === membre.id ? "danger" : "discret"}
                  onClick={() =>
                    aConfirmer === membre.id
                      ? retirer(membre.id)
                      : setAConfirmer(membre.id)
                  }
                  disabled={occupe || horsLigne}
                  classe="shrink-0"
                >
                  {aConfirmer === membre.id
                    ? mots.reglagesEcran.confirmer
                    : mots.reglagesEcran.retirer}
                </Bouton>
              )}
            </Carte>

            {aConfirmer === membre.id && (
              <p role="alert" className="mt-1.5 px-1 text-xs text-rouge">
                Le compte de {membre.nom} sera supprimé définitivement. Appuyez
                de nouveau pour confirmer.
              </p>
            )}
          </li>
        ))}

        {invitations.map((invitation) => (
          <li key={invitation.id}>
            <Carte provisoire classe="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="min-w-0">
                {/* Chasse fixe : un code se recopie caractere par caractere. */}
                <span className="chiffres block font-mono text-base font-semibold tracking-[0.25em] text-encre">
                  {invitation.code}
                </span>
                <span className="block text-xs text-gris">
                  {mots.reglagesEcran.expireLe(
                    new Date(invitation.expire_le).toLocaleDateString(mots.locale)
                  )}
                </span>
              </span>

              <span className="flex shrink-0 gap-1">
                <Bouton
                  type="button"
                  taille="compact"
                  allure="discret"
                  onClick={() => copier(invitation.code)}
                  classe={copie === invitation.code ? "text-vert" : undefined}
                >
                  {copie === invitation.code ? (
                    <>
                      <Check size={12} weight="bold" />
                      {mots.reglagesEcran.copie}
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      {mots.reglagesEcran.copier}
                    </>
                  )}
                </Bouton>

                {estProprietaire && (
                  <Bouton
                    type="button"
                    taille="compact"
                    allure="discret"
                    onClick={() => annuler(invitation.id)}
                    disabled={occupe || horsLigne}
                  >
                    {mots.annuler}
                  </Bouton>
                )}
              </span>
            </Carte>
          </li>
        ))}
      </ul>

      {estProprietaire && (
        <>
          <Bouton
            type="button"
            allure="secondaire"
            pleineLargeur
            onClick={inviter}
            disabled={occupe || horsLigne || complet}
            classe="mt-3"
          >
            {!complet && <UserPlus size={15} />}
            {complet ? mots.reglagesEcran.placesPrises : mots.reglagesEcran.inviter}
          </Bouton>

          <p className="mt-2 text-xs text-gris">
            {complet
              ? mots.reglagesEcran.aidePlacesPrises
              : horsLigne
                ? mots.reglagesEcran.inviterHorsLigne
                : mots.reglagesEcran.aideInviter}
          </p>
        </>
      )}
    </section>
  );
}
