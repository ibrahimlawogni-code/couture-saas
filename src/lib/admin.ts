import "server-only";

import { createClient as creerClientService } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/*
 * L'arriere-guichet, cote serveur uniquement.
 *
 * « server-only » en tete : si un composant client importait ce fichier par
 * megarde, la construction echouerait au lieu d'expedier la cle de service
 * dans le navigateur. C'est le genre de faute qu'on ne voit pas en relisant
 * un import.
 *
 * Tout passe par la cle de service parce que l'administration traverse la
 * cloison entre ateliers. L'alternative - ouvrir des politiques RLS a un
 * role administrateur sur clients, commandes et paiements - aurait ajoute
 * un chemin de lecture permanent sur les tables les plus sensibles du
 * produit, ouvert a tout navigateur connecte. Ici, aucune politique n'est
 * touchee : le pouvoir n'existe que dans ce fichier.
 */

function clientService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !cle) return null;

  return creerClientService(url, cle, { auth: { persistSession: false } });
}

/** Le compte connecte, ou null. */
export async function compteConnecte() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Le compte connecte s'il est administrateur, null sinon.
 *
 * Rend le compte plutot qu'un booleen : chaque action a besoin de savoir
 * *qui* agit pour le journal, et separer les deux questions ferait poser
 * deux fois la meme.
 */
export async function administrateurConnecte() {
  const compte = await compteConnecte();
  if (!compte) return null;

  const service = clientService();
  if (!service) return null;

  const { data, error } = await service
    .from("administrateurs")
    .select("id")
    .eq("id", compte.id)
    .maybeSingle();

  if (error || !data) return null;
  return compte;
}

export type AtelierAdmin = {
  id: string;
  nom: string;
  formule: string;
  orphelinDepuis: string | null;
  comptes: number;
  clients: number;
  commandes: number;
  derniereActivite: string | null;
};

/**
 * Les ateliers inscrits, avec de quoi juger s'ils vivent.
 *
 * Le nombre de comptes, de clients et de commandes se compte ici plutot
 * que par des vues SQL : le volume - quelques dizaines d'ateliers avant
 * longtemps - ne justifie pas une machinerie qu'il faudrait ensuite tenir
 * a jour a chaque migration.
 */
export async function listerAteliers(): Promise<AtelierAdmin[]> {
  const service = clientService();
  if (!service) return [];

  const [ateliers, utilisateurs, clients, commandes] = await Promise.all([
    service.from("ateliers").select("id, nom, formule, orphelin_depuis"),
    service.from("utilisateurs").select("atelier_id"),
    service.from("clients").select("atelier_id"),
    service.from("commandes").select("atelier_id, created_at"),
  ]);

  if (ateliers.error) return [];

  const compter = (lignes: { atelier_id: string }[] | null) => {
    const total = new Map<string, number>();
    for (const ligne of lignes ?? []) {
      total.set(ligne.atelier_id, (total.get(ligne.atelier_id) ?? 0) + 1);
    }
    return total;
  };

  const nbComptes = compter(utilisateurs.data);
  const nbClients = compter(clients.data);
  const nbCommandes = compter(commandes.data);

  // La derniere commande prise sert de signe de vie : c'est le geste qui
  // ramene un tailleur dans l'application.
  const derniere = new Map<string, string>();
  for (const commande of commandes.data ?? []) {
    const connue = derniere.get(commande.atelier_id);
    if (!connue || commande.created_at > connue) {
      derniere.set(commande.atelier_id, commande.created_at);
    }
  }

  return (ateliers.data ?? [])
    .map((atelier) => ({
      id: atelier.id,
      nom: atelier.nom,
      formule: atelier.formule,
      orphelinDepuis: atelier.orphelin_depuis,
      comptes: nbComptes.get(atelier.id) ?? 0,
      clients: nbClients.get(atelier.id) ?? 0,
      commandes: nbCommandes.get(atelier.id) ?? 0,
      derniereActivite: derniere.get(atelier.id) ?? null,
    }))
    /*
     * Les ateliers vivants d'abord, les endormis ensuite. Un arriere-
     * guichet trie par date de creation met en tete ceux dont on n'a plus
     * rien a faire.
     */
    .sort((a, b) => (b.derniereActivite ?? "").localeCompare(a.derniereActivite ?? ""));
}

export type AdministrateurListe = {
  id: string;
  email: string | null;
  nom: string | null;
  depuis: string;
};

export async function listerAdministrateurs(): Promise<AdministrateurListe[]> {
  const service = clientService();
  if (!service) return [];

  const { data, error } = await service
    .from("administrateurs")
    .select("id, created_at");

  if (error || !data) return [];

  /*
   * L'adresse vient de auth.users, que PostgREST n'expose pas : il faut
   * passer par l'API d'administration. Sans elle, la liste n'afficherait
   * que des identifiants, et nommer ou revoquer quelqu'un reviendrait a
   * jouer aux devinettes.
   */
  const { data: comptes } = await service.auth.admin.listUsers({ perPage: 200 });
  const parId = new Map(
    (comptes?.users ?? []).map((compte) => [compte.id, compte])
  );

  const { data: profils } = await service.from("utilisateurs").select("id, nom");
  const nomParId = new Map((profils ?? []).map((p) => [p.id, p.nom as string]));

  return data
    .map((ligne) => ({
      id: ligne.id,
      email: parId.get(ligne.id)?.email ?? null,
      nom: nomParId.get(ligne.id) ?? null,
      depuis: ligne.created_at,
    }))
    .sort((a, b) => a.depuis.localeCompare(b.depuis));
}

/** Retrouve un compte par son adresse, pour le nommer administrateur. */
export async function compteParEmail(email: string) {
  const service = clientService();
  if (!service) return null;

  const { data } = await service.auth.admin.listUsers({ perPage: 200 });
  const cherche = email.trim().toLowerCase();

  return (
    (data?.users ?? []).find(
      (compte) => compte.email?.toLowerCase() === cherche
    ) ?? null
  );
}

/*
 * Les trois gestes. Ils passent par les fonctions SQL plutot que par des
 * update directs : c'est la base qui verifie que l'appelant est bien
 * administrateur et qui ecrit le journal, dans la meme transaction. Ecrire
 * la trace ici, apres coup, laisserait un geste sans trace le jour ou le
 * serveur s'arrete entre les deux.
 */
export async function changerFormule(
  atelier: string,
  formule: string,
  par: string
) {
  const service = clientService();
  if (!service) return "Configuration incomplète sur ce déploiement.";

  const { error } = await service.rpc("admin_changer_formule", {
    atelier,
    nouvelle_formule: formule,
    par,
  });

  return error?.message ?? null;
}

export async function nommerAdministrateur(compte: string, par: string) {
  const service = clientService();
  if (!service) return "Configuration incomplète sur ce déploiement.";

  const { error } = await service.rpc("admin_nommer", { compte, par });
  return error?.message ?? null;
}

export async function revoquerAdministrateur(compte: string, par: string) {
  const service = clientService();
  if (!service) return "Configuration incomplète sur ce déploiement.";

  const { error } = await service.rpc("admin_revoquer", { compte, par });
  return error?.message ?? null;
}

export type LigneJournal = {
  id: string;
  action: string;
  quand: string;
  parEmail: string | null;
  atelier: string | null;
  cibleEmail: string | null;
  details: Record<string, unknown>;
};

export async function lireJournal(limite = 30): Promise<LigneJournal[]> {
  const service = clientService();
  if (!service) return [];

  const { data, error } = await service
    .from("journal_admin")
    .select("id, administrateur, action, atelier_id, compte_cible, details, created_at")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error || !data) return [];

  const [{ data: comptes }, { data: ateliers }] = await Promise.all([
    service.auth.admin.listUsers({ perPage: 200 }),
    service.from("ateliers").select("id, nom"),
  ]);

  const emailParId = new Map(
    (comptes?.users ?? []).map((compte) => [compte.id, compte.email ?? null])
  );
  const nomAtelier = new Map(
    (ateliers ?? []).map((atelier) => [atelier.id, atelier.nom as string])
  );

  return data.map((ligne) => ({
    id: ligne.id,
    action: ligne.action,
    quand: ligne.created_at,
    parEmail: emailParId.get(ligne.administrateur) ?? null,
    atelier: ligne.atelier_id ? (nomAtelier.get(ligne.atelier_id) ?? null) : null,
    cibleEmail: ligne.compte_cible
      ? (emailParId.get(ligne.compte_cible) ?? null)
      : null,
    details: (ligne.details ?? {}) as Record<string, unknown>,
  }));
}
