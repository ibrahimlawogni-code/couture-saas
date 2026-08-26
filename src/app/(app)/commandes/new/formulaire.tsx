"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { MODELES, MODELE_AUTRE } from "@/lib/commandes";
import { METHODE_DEFAUT, type Methode } from "@/lib/paiements";
import { enregistrer } from "@/lib/offline/enregistrer";
import { estLimiteOffre, messageRefus } from "@/lib/offline/erreurs";
import { cheminPhoto, compresserPhoto } from "@/lib/offline/photo";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { useHydratation } from "@/lib/hydratation";
import { Bouton, LienBouton } from "@/ui/bouton";
import { Champ, Selecteur } from "@/ui/champ";
import { ChoixMethode } from "@/ui/choix-methode";
import { EtatVide } from "@/ui/etat-vide";
import { Message } from "@/ui/message";
import type { PhotoEnAttente } from "@/lib/offline/db";

type ClientOption = { id: string; nom: string };

export function FormulaireCommande({
  atelierId,
  utilisateurId,
  clients,
  clientPreselectionne,
}: {
  atelierId: string;
  utilisateurId: string;
  clients: ClientOption[];
  clientPreselectionne?: string;
}) {
  const router = useRouter();
  const { enAttente } = useFileAttente();
  const pret = useHydratation();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [limite, setLimite] = useState(false);
  const [modele, setModele] = useState("");
  const [acompte, setAcompte] = useState("");
  const [methode, setMethode] = useState<Methode>(METHODE_DEFAUT);

  // Un client cree hors ligne doit pouvoir recevoir une commande
  // immediatement, sans attendre sa synchronisation.
  const clientsEnAttente = enAttente
    .filter((operation) => operation.table === "clients")
    .map((operation) => ({
      id: String(operation.donnees.id),
      nom: `${String(operation.donnees.nom ?? "Sans nom")} (en attente)`,
    }));

  const tousLesClients = [...clients, ...clientsEnAttente];

  async function preparerPhoto(fichier: File | null): Promise<PhotoEnAttente | null> {
    if (!fichier || fichier.size === 0) return null;

    return {
      chemin: cheminPhoto(atelierId),
      blob: await compresserPhoto(fichier),
    };
  }

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);
    setLimite(false);
    setEnvoi(true);

    const formulaire = new FormData(evenement.currentTarget);
    const clientId = String(formulaire.get("client_id") ?? "");

    const [photoModèle, photoTissu] = await Promise.all([
      preparerPhoto(formulaire.get("photo_modele") as File | null),
      preparerPhoto(formulaire.get("photo_tissu") as File | null),
    ]);

    const photos = [photoModèle, photoTissu].filter(
      (photo): photo is PhotoEnAttente => photo !== null
    );

    // La commande fige les mesures les plus recentes connues du client.
    let mesureId: string | null = null;
    if (navigator.onLine) {
      const supabase = createClient();
      const { data } = await supabase
        .from("mesures")
        .select("id")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      mesureId = data?.id ?? null;
    }

    const commandeId = crypto.randomUUID();
    const prixTotal = Number(formulaire.get("prix_total") ?? 0);
    const acompte = Number(formulaire.get("acompte") ?? 0);

    /*
     * La sentinelle « Autre » ne doit jamais atteindre la base : c'est le
     * champ libre qui porte alors le nom du modele.
     */
    const choixModele = String(formulaire.get("nom_modele") ?? "");
    const nomModele =
      (choixModele === MODELE_AUTRE
        ? String(formulaire.get("nom_modele_autre") ?? "")
        : choixModele
      ).trim() || null;

    let enFile = false;

    try {
      ({ enFile } = await enregistrer(
        "commandes",
        {
          id: commandeId,
          created_at: new Date().toISOString(),
          atelier_id: atelierId,
          client_id: clientId,
          mesure_id: mesureId,
          // Repete la valeur par defaut de la base : une commande saisie hors
          // ligne s'affiche depuis la file, ou aucune colonne n'est calculee
          // par Postgres, et se retrouverait donc sans statut dans le tableau.
          statut: "recu",
          nom_modele: nomModele,
          photo_modele_url: photoModèle?.chemin ?? null,
          photo_tissu_url: photoTissu?.chemin ?? null,
          prix_total: prixTotal,
          date_essayage: String(formulaire.get("date_essayage") ?? "") || null,
          date_livraison: String(formulaire.get("date_livraison") ?? "") || null,
          cree_par: utilisateurId,
        },
        photos
      ));
    } catch (erreur) {
      // Refus de la base, une limite d'offre par exemple. Le paiement
      // qui suit ne doit surtout pas partir sans sa commande.
      setErreur(messageRefus(erreur));
      setLimite(estLimiteOffre(erreur));
      setEnvoi(false);
      return;
    }

    if (acompte > 0) {
      await enregistrer("paiements", {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        commande_id: commandeId,
        montant: acompte,
        type: "acompte",
        methode,
      });
    }

    router.push(enFile ? "/commandes" : `/commandes/${commandeId}`);
    router.refresh();
  }

  if (tousLesClients.length === 0) {
    return (
      <EtatVide
        classe="mt-6"
        icone={Users}
        titre="Aucun client à qui rattacher la commande"
        texte="Une commande appartient toujours à un client : c'est sa fiche qui porte les mesures."
        action={<LienBouton href="/clients/new">Créer un client</LienBouton>}
      />
    );
  }

  return (
    <form onSubmit={soumettre} className="mt-6 flex flex-col gap-4">
      {erreur &&
        (limite ? (
          <Message ton="attention" titre={erreur}>
            <Link href="/#tarifs">Voir les offres</Link>
          </Message>
        ) : (
          <Message ton="probleme">{erreur}</Message>
        ))}

      <Selecteur
        id="client_id"
        name="client_id"
        libelle="Client"
        required
        defaultValue={clientPreselectionne ?? ""}
      >
        <option value="" disabled>
          Choisir un client
        </option>
        {tousLesClients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.nom}
          </option>
        ))}
      </Selecteur>

      {/*
       * Le modele se choisit dans une liste, et non plus a la main. C'est
       * la meme dizaine de pieces qui revient, et les ecrire chaque fois
       * produisait des libelles differents pour un meme vetement - ce qui
       * se voit ensuite dans le recu remis au client.
       *
       * « Autre » ouvre un champ libre : un tailleur coud aussi des pieces
       * qui ne sont dans aucune liste, et l'obliger a choisir lui ferait
       * ranger une robe de mariee sous « Robe (Moderne) ».
       */}
      <Selecteur
        id="nom_modele"
        name="nom_modele"
        libelle="Modèle"
        value={modele}
        onChange={(evenement) => setModele(evenement.target.value)}
      >
        <option value="">Sans modèle</option>
        {MODELES.map((nom) => (
          <option key={nom} value={nom}>
            {nom}
          </option>
        ))}
        <option value={MODELE_AUTRE}>Autre…</option>
      </Selecteur>

      {modele === MODELE_AUTRE && (
        <Champ
          id="nom_modele_autre"
          name="nom_modele_autre"
          type="text"
          libelle="Préciser le modèle"
          placeholder="Boubou brodé, tenue de mariée..."
          autoFocus
          required
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <ChampPhoto id="photo_modele" libelle="Photo modèle" />
        <ChampPhoto id="photo_tissu" libelle="Photo tissu" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Champ
          id="prix_total"
          name="prix_total"
          type="number"
          libelle="Prix total (FCFA)"
          min="0"
          step="1"
          inputMode="numeric"
          required
        />
        <Champ
          id="acompte"
          name="acompte"
          type="number"
          libelle="Acompte versé"
          min="0"
          step="1"
          inputMode="numeric"
          value={acompte}
          onChange={(evenement) => setAcompte(evenement.target.value)}
        />
      </div>

      {/*
       * Le moyen n'apparait qu'une fois un acompte saisi : demander
       * comment a ete paye un acompte inexistant n'a pas de sens, et
       * chaque champ de plus sur cet ecran se paie en abandons.
       */}
      {Number(acompte) > 0 && (
        <ChoixMethode
          nom="methode"
          valeur={methode}
          onChange={setMethode}
          libelle="Acompte reçu en"
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Champ
          id="date_essayage"
          name="date_essayage"
          type="date"
          libelle="Date d'essayage"
        />
        <Champ
          id="date_livraison"
          name="date_livraison"
          type="date"
          libelle="Date de livraison"
        />
      </div>

      <Bouton
        type="submit"
        disabled={!pret || envoi}
        pleineLargeur
        classe="mt-2 min-h-12"
      >
        {!pret
          ? "Chargement..."
          : envoi
            ? "Enregistrement..."
            : "Enregistrer la commande"}
      </Bouton>
    </form>
  );
}

/**
 * Champ photo.
 *
 * Le controle natif affiche « Choisir un fichier / Aucun fichier
 * selectionne » dans la police du systeme, ce qui jurait au milieu des
 * autres champs. Les variantes file: de Tailwind habillent le seul bouton
 * sans toucher au reste, et l'appareil photo reste celui du telephone.
 */
function ChampPhoto({ id, libelle }: { id: string; libelle: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-encre">
        {libelle}
      </label>
      <input
        id={id}
        name={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="w-full rounded-controle border border-bordure bg-white p-2 text-xs text-gris transition-colors duration-150 ease-doux hover:border-vert-pale file:mr-2 file:rounded-md file:border-0 file:bg-vert-clair file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-foret"
      />
    </div>
  );
}
