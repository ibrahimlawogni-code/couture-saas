"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { MODELES } from "@/lib/commandes";
import { METHODE_DEFAUT, type Methode } from "@/lib/paiements";
import { enregistrer } from "@/lib/offline/enregistrer";
import { estLimiteOffre, messageRefus } from "@/lib/offline/erreurs";
import { cheminPhoto, compresserPhoto } from "@/lib/offline/photo";
import { useDonnees } from "@/lib/offline/use-donnees";
import { useFileAttente } from "@/lib/offline/use-file-attente";
import { useHydratation } from "@/lib/hydratation";
import { Bouton, LienBouton } from "@/ui/bouton";
import { Champ, Selecteur } from "@/ui/champ";
import { useTraductions } from "@/lib/offline/use-traductions";
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
  const mots = useTraductions();
  const { commandes } = useDonnees();

  /*
   * Ce que l'atelier a deja cousu, propose avant la liste generale.
   *
   * C'est la partie qui compte : la liste livree avec le produit ne connait
   * ni « Boubou brode » ni « Tenue de bapteme », alors que ce sont peut-etre
   * les deux pieces que cet atelier fait le plus. Lues dans la copie locale,
   * donc disponibles hors reseau, comme le reste de l'ecran.
   */
  const suggestionsModeles = useMemo(() => {
    const siennes = new Set<string>();
    for (const commande of commandes) {
      const nom = commande.nom_modele?.trim();
      if (nom) siennes.add(nom);
    }

    // Les siennes d'abord, puis les courantes qu'elle n'a pas encore
    // utilisees : un tailleur retrouve son vocabulaire avant le notre.
    return [
      ...[...siennes].sort((a, b) => a.localeCompare(b)),
      ...MODELES.filter((nom) => !siennes.has(nom)),
    ];
  }, [commandes]);
  const router = useRouter();
  const { enAttente } = useFileAttente();
  const pret = useHydratation();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [limite, setLimite] = useState(false);
  const [acompte, setAcompte] = useState("");
  const [methode, setMethode] = useState<Methode>(METHODE_DEFAUT);

  // Un client cree hors ligne doit pouvoir recevoir une commande
  // immediatement, sans attendre sa synchronisation.
  const clientsEnAttente = enAttente
    .filter((operation) => operation.table === "clients")
    .map((operation) => ({
      id: String(operation.donnees.id),
      nom: mots.formulaires.nomEnAttente(
        String(operation.donnees.nom ?? mots.formulaires.sansNom)
      ),
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
     * Les espaces de bout sont retires, et les espaces internes reduits a
     * un seul. « Boubou  brode » et « Boubou brode » sont le meme vetement,
     * et deux lignes qui n'en different que par une frappe apparaitraient
     * comme deux modeles distincts dans les suggestions comme dans le recu.
     */
    const nomModele =
      String(formulaire.get("nom_modele") ?? "")
        .trim()
        .replace(/\s+/g, " ") || null;

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
        titre={mots.formulaires.aucunClient}
        texte={mots.formulaires.aucunClientTexte}
        action={<LienBouton href="/clients/new">Créer un client</LienBouton>}
      />
    );
  }

  return (
    <form onSubmit={soumettre} className="mt-6 flex flex-col gap-4">
      {erreur &&
        (limite ? (
          <Message ton="attention" titre={erreur}>
            <Link href="/#tarifs">{mots.formulaires.voirLesOffres}</Link>
          </Message>
        ) : (
          <Message ton="probleme">{erreur}</Message>
        ))}

      <Selecteur
        id="client_id"
        name="client_id"
        libelle={mots.formulaires.client}
        required
        defaultValue={clientPreselectionne ?? ""}
      >
        <option value="" disabled>
          {mots.formulaires.choisirClient}
        </option>
        {tousLesClients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.nom}
          </option>
        ))}
      </Selecteur>

      {/*
       * Un seul champ : on tape, ou on choisit dans les suggestions.
       *
       * C'etait une liste fermee avec une entree « Autre » qui ouvrait un
       * second champ. La liste existait pour une bonne raison - la meme
       * dizaine de pieces revient, et les ecrire chaque fois produisait des
       * libelles differents pour un meme vetement, ce qui se voit ensuite
       * sur le recu remis au client. Mais elle obligeait a descendre
       * jusqu'a « Autre » puis a remplir un champ de plus pour la robe de
       * mariee que la liste ne prevoit pas.
       *
       * Les suggestions repondent aux deux besoins a la fois. Elles portent
       * les modeles courants, et surtout ceux que cet atelier a deja
       * cousus : un tailleur qui ecrit « Boubou brode » une fois se le voit
       * proposer la suivante, et l'orthographe se fixe d'elle-meme au lieu
       * de deriver. La liste ne contraint plus, elle propose.
       */}
      <Champ
        id="nom_modele"
        name="nom_modele"
        type="text"
        list="modeles-suggeres"
        libelle={mots.formulaires.modele}
        aide={mots.formulaires.aideModele}
        placeholder={mots.formulaires.exempleModele}
        autoComplete="off"
      />
      <datalist id="modeles-suggeres">
        {suggestionsModeles.map((nom) => (
          <option key={nom} value={nom} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-3">
        <ChampPhoto id="photo_modele" libelle={mots.formulaires.photoModele} />
        <ChampPhoto id="photo_tissu" libelle={mots.formulaires.photoTissu} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Champ
          id="prix_total"
          name="prix_total"
          type="number"
          libelle={mots.formulaires.prixTotal}
          min="0"
          step="1"
          inputMode="numeric"
          required
        />
        <Champ
          id="acompte"
          name="acompte"
          type="number"
          libelle={mots.formulaires.acompteVerse}
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
          mots={mots}
          nom="methode"
          valeur={methode}
          onChange={setMethode}
          libelle={mots.formulaires.acompteRecuEn}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Champ
          id="date_essayage"
          name="date_essayage"
          type="date"
          libelle={mots.formulaires.dateEssayage}
        />
        <Champ
          id="date_livraison"
          name="date_livraison"
          type="date"
          libelle={mots.formulaires.dateLivraison}
        />
      </div>

      <Bouton
        type="submit"
        disabled={!pret || envoi}
        pleineLargeur
        classe="mt-2 min-h-12"
      >
        {!pret
          ? mots.formulaires.chargement
          : envoi
            ? mots.formulaires.enregistrement
            : mots.formulaires.enregistrerCommande}
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
