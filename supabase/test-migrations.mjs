/*
 * Banc d'essai des migrations SQL.
 *
 * Dix migrations portent les regles d'argent et d'acces du produit, et rien
 * ne les verifiait : elles etaient collees dans le SQL editor de Supabase et
 * jugees sur pieces. Ce banc les applique dans l'ordre a un Postgres neuf,
 * puis exerce les parcours d'inscription.
 *
 * PGlite plutot que Docker ou un projet Supabase de test : c'est un vrai
 * Postgres compile en WebAssembly, il demarre en memoire, et le banc entier
 * tourne en quelques secondes sans rien installer sur la machine.
 *
 *   npm run test:migrations
 *
 * Il vit ici plutot qu'a la racine : /test-*.mjs y est ignore par git, une
 * regle posee pour les scripts navigateur jetables. Celui-ci ne l'est pas.
 */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const MIGRATIONS = resolve(import.meta.dirname, "migrations");

/*
 * Ce que Supabase fournit et qu'un Postgres nu n'a pas. Strictement ce dont
 * les migrations ont besoin : de quoi les faire passer, pas de quoi imiter
 * Supabase.
 */
const PRELUDE = `
create schema if not exists auth;
create schema if not exists storage;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Supabase la tire du jeton ; ici d'une variable de session, que le banc
-- pose avant chaque appel pour se faire passer pour quelqu'un.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('banc.utilisateur', true), '')::uuid;
$$;

create table storage.buckets (
  id text primary key,
  name text,
  public boolean not null default false
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid
);

create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$
  select string_to_array(name, '/');
$$;

/*
 * Les droits que Supabase accorde d'office dans le schema public, et qu'un
 * Postgres nu n'a pas.
 *
 * Sans eux, le banc mentait : il affirmait que anon ne pouvait executer
 * aucune fonction d'administration, alors qu'en production Supabase lui
 * accorde EXECUTE sur toute nouvelle fonction. Un « revoke from public »
 * ne suffit pas a l'en priver, ces droits etant accordes nommement a anon
 * et authenticated, pas a PUBLIC.
 *
 * C'est la difference qui compte le plus dans ce fichier : un banc d'essai
 * plus permissif que la production ne protege de rien, il rassure.
 */
grant usage on schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
`;

// 0001 demande pgcrypto, que PGlite ne charge pas d'office.
const db = await PGlite.create({ extensions: { pgcrypto } });

await db.exec(PRELUDE);

for (const fichier of (await readdir(MIGRATIONS)).sort()) {
  if (!fichier.endsWith(".sql")) continue;
  try {
    await db.exec(await readFile(resolve(MIGRATIONS, fichier), "utf8"));
    console.log(`  applique  ${fichier}`);
  } catch (erreur) {
    console.log(`  ECHEC     ${fichier} : ${erreur.message}`);
    process.exit(1);
  }
}

// --- Outils du banc ------------------------------------------------------

let total = 0;
let rates = 0;

function verifier(nom, obtenu, attendu) {
  total += 1;
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (!ok) rates += 1;
  console.log(
    `  ${ok ? "ok  " : "RATE"}  ${nom}` +
      (ok
        ? ""
        : `\n          obtenu ${JSON.stringify(obtenu)}, attendu ${JSON.stringify(attendu)}`)
  );
}

/** Cree un compte comme le ferait Supabase, et rend l'erreur du declencheur. */
async function inscrire({ email, provider = "email", meta = {} }) {
  const id = crypto.randomUUID();
  try {
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
       values ($1, $2, $3::jsonb, $4::jsonb)`,
      [id, email, JSON.stringify(meta), JSON.stringify({ provider })]
    );
    return { id, erreur: null };
  } catch (erreur) {
    return { id, erreur: erreur.message };
  }
}

async function seFaisantPasserPour(id, action) {
  await db.query(`select set_config('banc.utilisateur', $1, false)`, [id ?? ""]);
  try {
    return await action();
  } finally {
    await db.query(`select set_config('banc.utilisateur', '', false)`);
  }
}

async function terminer(id, params = {}) {
  return seFaisantPasserPour(id, async () => {
    try {
      await db.query(
        `select terminer_inscription(
           atelier_nom := $1, nom_utilisateur := $2, code_invitation := $3)`,
        [params.atelier ?? "", params.nom ?? "", params.code ?? ""]
      );
      return null;
    } catch (erreur) {
      return erreur.message;
    }
  });
}

const compter = async (sql, params = []) =>
  Number((await db.query(sql, params)).rows[0].n);

const lireUtilisateur = async (id) =>
  (
    await db.query(
      `select u.nom, u.role, a.nom as atelier
         from utilisateurs u join ateliers a on a.id = u.atelier_id
        where u.id = $1`,
      [id]
    )
  ).rows[0] ?? null;

async function inviter(atelierId, role = "apprenti") {
  const code = `C${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  await db.query(
    `insert into invitations (atelier_id, code, role) values ($1, $2, $3)`,
    [atelierId, code, role]
  );
  return code;
}

// =========================================================================
console.log("\nA. Parcours par email : doit rester inchange\n");
// =========================================================================

const a1 = await inscrire({
  email: "kossi@atelier.bj",
  meta: { atelier_nom: "Atelier Kossi", nom: "Kossi Adjovi" },
});
verifier("A1 inscription email : aucune erreur", a1.erreur, null);
verifier("A1 atelier cree et role proprietaire", await lireUtilisateur(a1.id), {
  nom: "Kossi Adjovi",
  role: "proprietaire",
  atelier: "Atelier Kossi",
});

const atelierKossi = (
  await db.query(`select atelier_id from utilisateurs where id = $1`, [a1.id])
).rows[0].atelier_id;

/*
 * Un atelier nait sur la formule Decouverte, dont max_comptes vaut 1 : il
 * n'accepte aucun apprenti tant qu'il n'est pas passe a Atelier Pro. C'est
 * voulu, la page de tarifs y reservant les apprentis. Le banc doit donc
 * changer d'offre avant d'inviter.
 */
const formule = async (code) =>
  db.query(`update ateliers set formule = $1 where id = $2`, [code, atelierKossi]);

await formule("atelier_pro");
verifier(
  "A2 la formule pro releve la limite de comptes",
  await compter(`select limite_utilisateurs n from ateliers where id = $1`, [
    atelierKossi,
  ]),
  6
);

const codeValide = await inviter(atelierKossi);
const a3 = await inscrire({
  email: "apprenti@atelier.bj",
  meta: { nom: "Sena", code_invitation: codeValide },
});
verifier("A3 inscription sur code : aucune erreur", a3.erreur, null);
verifier("A3 rattache a l atelier du patron", await lireUtilisateur(a3.id), {
  nom: "Sena",
  role: "apprenti",
  atelier: "Atelier Kossi",
});
verifier(
  "A3 invitation marquee comme utilisee",
  await compter(
    `select count(*) n from invitations where code = $1 and utilisee_le is not null`,
    [codeValide]
  ),
  1
);

const a4 = await inscrire({
  email: "faux@atelier.bj",
  meta: { nom: "X", code_invitation: "NEXISTEPAS" },
});
verifier(
  "A4 code invalide refuse",
  /code_invitation_invalide/.test(a4.erreur ?? ""),
  true
);
verifier(
  "A4 aucun compte laisse derriere",
  await compter(`select count(*) n from auth.users where email = 'faux@atelier.bj'`),
  0
);

// Retour a l'offre Atelier : un seul compte, la place est deja prise.
await formule("atelier");
const codePlein = await inviter(atelierKossi);
const a5 = await inscrire({
  email: "detrop@atelier.bj",
  meta: { nom: "Trop", code_invitation: codePlein },
});
verifier("A5 atelier plein refuse", /atelier_complet/.test(a5.erreur ?? ""), true);
await formule("atelier_pro");

// =========================================================================
console.log("\nB. Inscription par fournisseur externe\n");
// =========================================================================

const ateliersAvant = await compter(`select count(*) n from ateliers`);

const b1 = await inscrire({
  email: "google1@gmail.com",
  provider: "google",
  meta: { full_name: "Adjoa Hounkpatin", email_verified: true },
});
verifier("B1 compte cree sans erreur", b1.erreur, null);
verifier(
  "B1 aucune ligne utilisateurs",
  await compter(`select count(*) n from utilisateurs where id = $1`, [b1.id]),
  0
);
verifier(
  "B1 aucun atelier ouvert",
  await compter(`select count(*) n from ateliers`),
  ateliersAvant
);

verifier(
  "B2 terminer_inscription : aucune erreur",
  await terminer(b1.id, { atelier: "Couture Adjoa" }),
  null
);
verifier("B2 atelier ouvert au bon nom", await lireUtilisateur(b1.id), {
  nom: "Adjoa Hounkpatin",
  role: "proprietaire",
  atelier: "Couture Adjoa",
});

/*
 * Le cas que toute la migration existe pour eviter : un second appel -
 * double envoi, retour arriere, rechargement - ne doit pas ouvrir un
 * atelier fantome.
 */
const ateliersApresB2 = await compter(`select count(*) n from ateliers`);
verifier(
  "B3 second appel : aucune erreur",
  await terminer(b1.id, { atelier: "Second atelier" }),
  null
);
verifier(
  "B3 aucun atelier fantome",
  await compter(`select count(*) n from ateliers`),
  ateliersApresB2
);

const codeB4 = await inviter(atelierKossi);
const b4 = await inscrire({
  email: "google2@gmail.com",
  provider: "google",
  meta: { full_name: "Yao Mensah" },
});
verifier(
  "B4 rattachement sur code : aucune erreur",
  await terminer(b4.id, { code: codeB4 }),
  null
);
verifier("B4 rejoint l atelier du patron", await lireUtilisateur(b4.id), {
  nom: "Yao Mensah",
  role: "apprenti",
  atelier: "Atelier Kossi",
});
verifier(
  "B4 invitation consommee",
  await compter(
    `select count(*) n from invitations where code = $1 and utilisee_le is not null`,
    [codeB4]
  ),
  1
);

const b5 = await inscrire({
  email: "google3@gmail.com",
  provider: "google",
  meta: { full_name: "Test" },
});
verifier(
  "B5 code invalide refuse",
  /code_invitation_invalide/.test((await terminer(b5.id, { code: "NEXISTEPAS" })) ?? ""),
  true
);
verifier(
  "B5 rien cree malgre le refus",
  await compter(`select count(*) n from utilisateurs where id = $1`, [b5.id]),
  0
);

// Retour a une offre a un seul compte : l'atelier de Kossi est plein.
await formule("atelier");
verifier(
  "B6 atelier plein refuse",
  /atelier_complet/.test((await terminer(b5.id, { code: await inviter(atelierKossi) })) ?? ""),
  true
);

verifier(
  "B7 sans session refuse",
  /non_authentifie/.test((await terminer(null, { atelier: "Sans personne" })) ?? ""),
  true
);

// Nom : la saisie l'emporte, le fournisseur sert de repli.
const b8 = await inscrire({
  email: "google4@gmail.com",
  provider: "google",
  meta: { full_name: "Nom Google" },
});
await terminer(b8.id, { atelier: "Atelier B8", nom: "Nom Corrige" });
verifier(
  "B8 le nom saisi l emporte sur celui de Google",
  (await lireUtilisateur(b8.id)).nom,
  "Nom Corrige"
);

const b9 = await inscrire({
  email: "google5@gmail.com",
  provider: "google",
  meta: { name: "Nom Sous name" },
});
await terminer(b9.id, { atelier: "Atelier B9" });
verifier(
  "B9 repli sur name quand full_name manque",
  (await lireUtilisateur(b9.id)).nom,
  "Nom Sous name"
);

const b10 = await inscrire({
  email: "google6@gmail.com",
  provider: "google",
  meta: {},
});
await terminer(b10.id, {});
verifier("B10 sans nom ni atelier : replis appliques", await lireUtilisateur(b10.id), {
  nom: "Utilisateur",
  role: "proprietaire",
  atelier: "Mon atelier",
});

// =========================================================================
console.log("\nC. Droits sur la fonction\n");
// =========================================================================

const droits = (
  await db.query(`
    select
      has_function_privilege('anon', 'terminer_inscription(text,text,text)', 'execute') as anon,
      has_function_privilege('authenticated', 'terminer_inscription(text,text,text)', 'execute') as authenticated
  `)
).rows[0];
verifier("C1 anon ne peut pas l executer", droits.anon, false);
verifier("C2 authenticated le peut", droits.authenticated, true);

// =========================================================================
console.log("\nD. Robustesse de la migration elle-meme\n");
// =========================================================================

/*
 * Un compte anterieur a la migration peut n'avoir aucun raw_app_meta_data.
 * Le defaut a 'email' doit alors s'appliquer, sinon toute inscription
 * ancienne basculerait du cote fournisseur et perdrait son atelier.
 */
const d1 = await db.query(
  `insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
   values (gen_random_uuid(), 'ancien@atelier.bj',
           '{"atelier_nom":"Atelier Ancien","nom":"Ancien"}'::jsonb, '{}'::jsonb)
   returning id`
);
verifier(
  "D1 compte sans provider : traite comme email",
  await lireUtilisateur(d1.rows[0].id),
  { nom: "Ancien", role: "proprietaire", atelier: "Atelier Ancien" }
);

// La migration sera collee dans le SQL editor, peut-etre deux fois.
let rejeu = null;
try {
  await db.exec(
    await readFile(resolve(MIGRATIONS, "0010_inscription_par_fournisseur.sql"), "utf8")
  );
} catch (erreur) {
  rejeu = erreur.message;
}
verifier("D2 migration rejouable sans erreur", rejeu, null);

const d3 = await inscrire({
  email: "apres-rejeu@gmail.com",
  provider: "google",
  meta: { full_name: "Apres Rejeu" },
});
verifier(
  "D3 comportement identique apres rejeu",
  await compter(`select count(*) n from utilisateurs where id = $1`, [d3.id]),
  0
);

// =========================================================================
console.log("\nE. Avis clients : une porte ouverte sans compte\n");
// =========================================================================

/*
 * La migration 0011 laisse un visiteur sans session ecrire dans la base.
 * C'est le seul endroit du produit ou cela arrive, et deux fonctions
 * security definer y travaillent hors RLS : ce qui suit verifie que leur
 * portee tient bien au jeton et a rien d'autre.
 */

const clientAvis = (
  await db.query(
    `insert into clients (atelier_id, nom) values ($1, 'Cliente Avis') returning id`,
    [atelierKossi]
  )
).rows[0].id;

async function creerCommande(statut, modele = "Boubou brode") {
  const ligne = (
    await db.query(
      `insert into commandes (atelier_id, client_id, nom_modele, statut)
       values ($1, $2, $3, $4) returning id, jeton_avis`,
      [atelierKossi, clientAvis, modele, statut]
    )
  ).rows[0];
  return ligne;
}

const noter = async (jeton, note, commentaire = null) => {
  try {
    await db.query(`select laisser_avis($1, $2::smallint, $3)`, [
      jeton,
      note,
      commentaire,
    ]);
    return null;
  } catch (erreur) {
    return erreur.message;
  }
};

const livree = await creerCommande("livre");
const enCoursAvis = await creerCommande("couture");

// E1 : chaque commande recoit un jeton distinct, y compris celles creees
// avant la migration.
const jetons = await compter(
  `select count(distinct jeton_avis) n from commandes`
);
const nbCommandes = await compter(`select count(*) n from commandes`);
verifier("E1 un jeton distinct par commande", jetons, nbCommandes);

// E2 : le visiteur voit de quoi reconnaitre sa commande, et rien de plus.
const vue = (
  await db.query(`select * from commande_a_noter($1)`, [livree.jeton_avis])
).rows[0];
verifier("E2 le jeton donne l atelier et le modele", vue, {
  atelier: "Atelier Kossi",
  modele: "Boubou brode",
  deja_note: false,
});

// E3 : on ne note pas un vetement qu'on n'a pas recu.
verifier(
  "E3 une commande non livree ne repond pas",
  (await db.query(`select * from commande_a_noter($1)`, [enCoursAvis.jeton_avis]))
    .rows.length,
  0
);

// E4 : un jeton invente n'ouvre rien.
verifier(
  "E4 un jeton inconnu ne repond pas",
  (
    await db.query(`select * from commande_a_noter($1)`, [
      "00000000-0000-0000-0000-000000000000",
    ])
  ).rows.length,
  0
);

// E5 : la note passe.
verifier("E5 laisser une note", await noter(livree.jeton_avis, 5, "  Parfait  "), null);
verifier(
  "E5b le commentaire est nettoye",
  (await db.query(`select note, commentaire from avis where commande_id = $1`, [livree.id]))
    .rows[0],
  { note: 5, commentaire: "Parfait" }
);

// E6 : une seule note par commande. Sans cela, un lien partage laisserait
// noter en boucle.
verifier("E6 deuxieme note refusee", await noter(livree.jeton_avis, 1), "deja_note");

// E7 : les bornes de la note.
const horsBornes = await creerCommande("livre", "Chemise");
verifier("E7 note a zero refusee", await noter(horsBornes.jeton_avis, 0), "note_invalide");
verifier("E7b note a six refusee", await noter(horsBornes.jeton_avis, 6), "note_invalide");
verifier(
  "E7c aucune trace laissee par les refus",
  await compter(`select count(*) n from avis where commande_id = $1`, [horsBornes.id]),
  0
);

// E8 : noter une commande non livree.
verifier(
  "E8 commande non livree : refus",
  await noter(enCoursAvis.jeton_avis, 5),
  "commande_introuvable"
);

// E9 : l'avis est rattache au bon atelier, sans quoi il compterait pour
// quelqu'un d'autre.
verifier(
  "E9 avis rattache a l atelier de la commande",
  await compter(`select count(*) n from avis where atelier_id = $1`, [atelierKossi]),
  1
);

/*
 * E10 : ce qui protege reellement.
 *
 * Supabase accorde d'office SELECT et INSERT sur toute nouvelle table du
 * schema public a anon et authenticated : interroger has_table_privilege
 * repondrait « oui » sans que cela veuille dire qu'une ligne est lisible.
 * Ce qui protege ces tables, c'est RLS et ses politiques.
 */
const droitsAvis = (
  await db.query(`
    select
      has_function_privilege('anon', 'laisser_avis(uuid,smallint,text)', 'execute') as poser,
      has_function_privilege('anon', 'commande_a_noter(uuid)', 'execute') as lire,
      (select relrowsecurity from pg_class where relname = 'avis') as rls_avis,
      (select relrowsecurity from pg_class where relname = 'commandes') as rls_commandes,
      (select count(*) from pg_policies
        where tablename = 'avis' and cmd <> 'SELECT') as ecritures_avis
  `)
).rows[0];
verifier("E10 anon peut deposer un avis", droitsAvis.poser, true);
verifier("E10b anon peut lire la commande a noter", droitsAvis.lire, true);
verifier("E10c la table avis est sous RLS", droitsAvis.rls_avis, true);
verifier("E10d aucune politique d ecriture sur avis", Number(droitsAvis.ecritures_avis), 0);
verifier("E10e les commandes restent sous RLS", droitsAvis.rls_commandes, true);

// E11 : la migration sera collee dans le SQL editor, peut-etre deux fois.
let rejeuAvis = null;
try {
  await db.exec(await readFile(resolve(MIGRATIONS, "0011_avis.sql"), "utf8"));
} catch (erreur) {
  rejeuAvis = erreur.message;
}
verifier("E11 migration rejouable sans erreur", rejeuAvis, null);

verifier(
  "E11b les jetons survivent au rejeu",
  (await db.query(`select jeton_avis from commandes where id = $1`, [livree.id]))
    .rows[0].jeton_avis,
  livree.jeton_avis
);

// =========================================================================
console.log("\nF. Administrateurs de la plateforme\n");
// =========================================================================

/*
 * Le pouvoir cree ici traverse la cloison entre ateliers. Ce qui suit
 * verifie surtout ce qu'il ne doit PAS permettre.
 */

const patron = (await inscrire({ email: "patron@tailorhub.bj" })).id;
const adjoint = (await inscrire({ email: "adjoint@tailorhub.bj" })).id;
const quidam = (await inscrire({ email: "quidam@atelier.bj" })).id;

const appeler = async (sql, params) => {
  try {
    await db.query(sql, params);
    return null;
  } catch (erreur) {
    return erreur.message;
  }
};

const estAdmin = async (id) =>
  (await db.query(`select est_administrateur($1) as oui`, [id])).rows[0].oui;

// F1 : personne n'est administrateur au depart. La migration ne nomme
// personne, exprès.
verifier(
  "F1 aucun administrateur apres la migration",
  await compter(`select count(*) n from administrateurs`),
  0
);

// F2 : sans premier administrateur, personne ne peut s'en nommer un.
verifier(
  "F2 un quidam ne peut nommer personne",
  await appeler(`select admin_nommer($1, $2)`, [quidam, quidam]),
  "non_administrateur"
);

// Le premier se nomme a la main, comme le dit la migration.
await db.query(`insert into administrateurs (id) values ($1)`, [patron]);

verifier("F3 le patron est administrateur", await estAdmin(patron), true);
verifier("F3b l adjoint ne l est pas encore", await estAdmin(adjoint), false);

// F4 : le patron delegue.
verifier(
  "F4 le patron nomme son adjoint",
  await appeler(`select admin_nommer($1, $2)`, [adjoint, patron]),
  null
);
verifier("F4b l adjoint est administrateur", await estAdmin(adjoint), true);

/*
 * Un atelier a lui, et non celui des sections precedentes : elles ont deja
 * change sa formule, et un banc dont une section depend de l'etat laisse
 * par une autre casse a la premiere reorganisation.
 */
const atelierClient = (
  await db.query(
    `insert into ateliers (nom, formule) values ('Atelier Payeur', 'decouverte')
     returning id`
  )
).rows[0].id;

// F5 : changer l'offre d'un atelier, le geste qui remplace l'encaissement.
verifier(
  "F5 l adjoint change une offre",
  await appeler(`select admin_changer_formule($1, $2, $3)`, [
    atelierClient,
    "atelier_pro",
    adjoint,
  ]),
  null
);
verifier(
  "F5b l offre est bien changee",
  (await db.query(`select formule from ateliers where id = $1`, [atelierClient]))
    .rows[0].formule,
  "atelier_pro"
);

// F6 : la trace. C'est elle qui rend la delegation tenable.
const trace = (
  await db.query(
    `select administrateur, action,
            details ->> 'avant' as avant, details ->> 'apres' as apres
       from journal_admin
      where action = 'formule' order by created_at desc limit 1`
  )
).rows[0];
verifier("F6 le journal retient qui a agi", trace.administrateur, adjoint);
verifier("F6b et d ou l atelier vient", trace.avant, "decouverte");
verifier("F6c et ou il va", trace.apres, "atelier_pro");

// F7 : un double clic ne doit pas raconter un changement qui n'a pas eu lieu.
const avantRejeu = await compter(`select count(*) n from journal_admin`);
await appeler(`select admin_changer_formule($1, $2, $3)`, [
  atelierClient,
  "atelier_pro",
  adjoint,
]);
verifier(
  "F7 rechanger vers la meme offre ne journalise rien",
  await compter(`select count(*) n from journal_admin`),
  avantRejeu
);

// F8 : ce que le pouvoir ne permet pas.
verifier(
  "F8 un quidam ne change aucune offre",
  await appeler(`select admin_changer_formule($1, $2, $3)`, [
    atelierClient,
    "decouverte",
    quidam,
  ]),
  "non_administrateur"
);
verifier(
  "F8b une offre inventee est refusee",
  await appeler(`select admin_changer_formule($1, $2, $3)`, [
    atelierClient,
    "offre_gratuite_a_vie",
    patron,
  ]),
  "formule_inconnue"
);
verifier(
  "F8c un atelier inconnu est refuse",
  await appeler(`select admin_changer_formule($1, $2, $3)`, [
    "00000000-0000-0000-0000-000000000000",
    "atelier",
    patron,
  ]),
  "atelier_introuvable"
);

// F9 : on ne se revoque pas soi-meme. Cette seule regle garantit qu'il
// reste toujours au moins un administrateur.
verifier(
  "F9 auto-revocation refusee",
  await appeler(`select admin_revoquer($1, $2)`, [patron, patron]),
  "auto_revocation"
);

verifier(
  "F9b le patron revoque son adjoint",
  await appeler(`select admin_revoquer($1, $2)`, [adjoint, patron]),
  null
);
verifier("F9c l adjoint a perdu le droit", await estAdmin(adjoint), false);
verifier(
  "F9d et ne peut plus rien changer",
  await appeler(`select admin_changer_formule($1, $2, $3)`, [
    atelierClient,
    "decouverte",
    adjoint,
  ]),
  "non_administrateur"
);

/*
 * F10 : la cloison, deux serrures.
 *
 * La premiere version de la migration se contentait de « revoke from
 * public », qui ne retire pas les droits que Supabase accorde nommement a
 * anon et authenticated : les fonctions d'administration etaient
 * joignables avec la cle anonyme. Elles refusaient l'appel, mais en
 * verifiant leur parametre « par » - fourni par l'appelant. Qui
 * connaissait l'identifiant d'un administrateur agissait en son nom.
 */
const cloison = (
  await db.query(`
    select
      has_function_privilege('authenticated', 'admin_changer_formule(uuid,text,uuid)', 'execute') as changer,
      has_function_privilege('anon', 'admin_changer_formule(uuid,text,uuid)', 'execute') as changer_anon,
      has_function_privilege('authenticated', 'admin_nommer(uuid,uuid)', 'execute') as nommer,
      has_function_privilege('authenticated', 'admin_revoquer(uuid,uuid)', 'execute') as revoquer,
      has_function_privilege('anon', 'est_administrateur(uuid)', 'execute') as sonder,
      has_function_privilege('service_role', 'admin_changer_formule(uuid,text,uuid)', 'execute') as serveur,
      has_table_privilege('authenticated', 'administrateurs', 'select') as lire_admins,
      has_table_privilege('anon', 'journal_admin', 'select') as lire_journal,
      (select relrowsecurity from pg_class where relname = 'administrateurs') as rls_admins,
      (select count(*) from pg_policies where tablename in ('administrateurs','journal_admin')) as politiques
  `)
).rows[0];
verifier("F10 authenticated ne change aucune offre", cloison.changer, false);
verifier("F10b anon non plus", cloison.changer_anon, false);
verifier("F10c authenticated ne nomme personne", cloison.nommer, false);
verifier("F10d authenticated ne revoque personne", cloison.revoquer, false);
verifier("F10e anon ne peut pas sonder qui est admin", cloison.sonder, false);
verifier("F10f mais le serveur le peut", cloison.serveur, true);
verifier("F10g authenticated ne lit pas les administrateurs", cloison.lire_admins, false);
verifier("F10h anon ne lit pas le journal", cloison.lire_journal, false);
verifier("F10i RLS active sur les administrateurs", cloison.rls_admins, true);
verifier("F10j et aucune politique ne l ouvre", Number(cloison.politiques), 0);

// F11 : la migration sera collee dans le SQL editor, peut-etre deux fois.
// Elle ne doit pas ressusciter un droit qu'on vient de retirer.
let rejeuAdmin = null;
try {
  await db.exec(await readFile(resolve(MIGRATIONS, "0012_administrateurs.sql"), "utf8"));
} catch (erreur) {
  rejeuAdmin = erreur.message;
}
verifier("F11 migration rejouable sans erreur", rejeuAdmin, null);
verifier("F11b le patron reste administrateur", await estAdmin(patron), true);
verifier("F11c l adjoint reste revoque", await estAdmin(adjoint), false);

// =========================================================================
console.log("\nG. Abonnement paye\n");
// =========================================================================

/*
 * Un atelier neuf, pour ne pas heriter de l'etat que les sections
 * precedentes ont laisse a celui de Kossi.
 */
const abonne = await inscrire({
  email: "abonne@atelier.bj",
  meta: { atelier_nom: "Atelier Abonne", nom: "Sena" },
});
const atelierAbonne = (
  await db.query(`select atelier_id from utilisateurs where id = $1`, [abonne.id])
).rows[0].atelier_id;

const encaisser = async (tx, code, mois, montant = 5000) => {
  try {
    await db.query(
      `select enregistrer_paiement_abonnement($1, $2, $3, $4, $5)`,
      [atelierAbonne, tx, code, mois, montant]
    );
    return null;
  } catch (erreur) {
    return erreur.message;
  }
};

const lireAtelier = async (id = atelierAbonne) =>
  (
    await db.query(
      `select formule, limite_utilisateurs,
              round(extract(epoch from (abonnement_jusquau - now())) / 86400)::int as jours
         from ateliers where id = $1`,
      [id]
    )
  ).rows[0];

// Un mois calendaire fait 28 a 31 jours : on verifie un intervalle, pas
// une valeur exacte, sinon le banc echouerait selon le mois ou il tourne.
const dans = (valeur, min, max) => valeur >= min && valeur <= max;

const echeance = async () => (await db.query(
  `select abonnement_jusquau from ateliers where id = $1`, [atelierAbonne]
)).rows[0].abonnement_jusquau;

verifier("G1 un atelier neuf est sur la formule gratuite", await lireAtelier(), {
  formule: "decouverte",
  limite_utilisateurs: 1,
  jours: null,
});

verifier("G2 un versement passe : aucune erreur", await encaisser("TX-1", "atelier_pro", 1), null);

const apresPremier = await lireAtelier();
verifier("G2 la formule est posee", apresPremier.formule, "atelier_pro");
verifier("G2 le plafond de comptes suit la formule", apresPremier.limite_utilisateurs, 6);
verifier("G2 l echeance est a un mois", dans(apresPremier.jours, 27, 32), true);

/*
 * Le coeur de la table : un webhook se rejoue. Le prestataire reessaie
 * quand notre serveur a bronche, et rien n'empeche deux notifications pour
 * un meme versement. Sans la contrainte d'unicite, l'echeance serait
 * prolongee deux fois pour un seul paiement.
 */
const echeanceAvantRejeu = await echeance();
verifier("G3 rejeu du meme versement : aucune erreur", await encaisser("TX-1", "atelier_pro", 1), null);
verifier("G3 l echeance n a pas bouge", String(await echeance()), String(echeanceAvantRejeu));
verifier(
  "G3 un seul versement enregistre",
  await compter(`select count(*) n from paiements_abonnement where atelier_id = $1`, [
    atelierAbonne,
  ]),
  1
);

// Renouvellement avant terme : les jours deja payes sont conserves.
verifier("G4 second versement : aucune erreur", await encaisser("TX-2", "atelier_pro", 1), null);
verifier("G4 l echeance cumule au lieu de repartir de zero", dans((await lireAtelier()).jours, 57, 63), true);

/*
 * Reprise apres interruption : l'echeance repart de maintenant, pas de la
 * date echue. Crediter le temps ou l'atelier n'etait pas abonne
 * reviendrait a lui offrir son absence.
 */
await db.query(
  `update ateliers set abonnement_jusquau = now() - interval '40 days' where id = $1`,
  [atelierAbonne]
);
verifier("G5 versement apres interruption", await encaisser("TX-3", "atelier_pro", 1), null);
verifier("G5 l echeance repart de maintenant", dans((await lireAtelier()).jours, 27, 32), true);

/*
 * Retrogradation. La promesse faite a l'utilisateur est qu'on ne perd
 * rien : les plafonds de 0009 ne s'opposent qu'aux creations, jamais aux
 * lignes deja en place. On le verifie plutot que de l'affirmer.
 */
const codeAbonne = await inviter(atelierAbonne);
const apprentiAbonne = await inscrire({
  email: "apprenti-abonne@atelier.bj",
  meta: { nom: "Kofi", code_invitation: codeAbonne },
});
verifier("G6 un apprenti rejoint pendant l abonnement", apprentiAbonne.erreur, null);

const membresAvant = await compter(
  `select count(*) n from utilisateurs where atelier_id = $1`,
  [atelierAbonne]
);
verifier("G6 l atelier compte deux membres", membresAvant, 2);

await db.query(
  `update ateliers set abonnement_jusquau = now() - interval '1 day' where id = $1`,
  [atelierAbonne]
);
const retrogrades = Number(
  (await db.query(`select retrograder_abonnements_expires() as n`)).rows[0].n
);
verifier("G7 un atelier expire est retrograde", retrogrades, 1);
verifier("G7 retour sur la formule gratuite", await lireAtelier(), {
  formule: "decouverte",
  limite_utilisateurs: 1,
  jours: null,
});
verifier(
  "G7 les deux membres sont toujours la",
  await compter(`select count(*) n from utilisateurs where atelier_id = $1`, [
    atelierAbonne,
  ]),
  membresAvant
);
verifier(
  "G7 et l historique des versements est conserve",
  await compter(`select count(*) n from paiements_abonnement where atelier_id = $1`, [
    atelierAbonne,
  ]),
  3
);

verifier(
  "G8 un second passage ne retrograde plus personne",
  Number((await db.query(`select retrograder_abonnements_expires() as n`)).rows[0].n),
  0
);

// Refus de principe : mieux vaut une erreur bruyante qu'un versement range
// sous un atelier qui n'existe pas.
verifier(
  "G9 atelier inconnu refuse",
  /atelier_inconnu/.test(
    (await (async () => {
      try {
        await db.query(
          `select enregistrer_paiement_abonnement($1, 'TX-X', 'atelier_pro', 1, 5000)`,
          ["00000000-0000-0000-0000-000000000000"]
        );
        return "";
      } catch (e) {
        return e.message;
      }
    })()) ?? ""
  ),
  true
);
verifier(
  "G9 formule inconnue refusee",
  /formule_inconnue/.test((await encaisser("TX-Y", "formule_qui_n_existe_pas", 1)) ?? ""),
  true
);
verifier("G9 mois nul refuse", (await encaisser("TX-Z", "atelier_pro", 0)) !== null, true);

/*
 * Ces deux fonctions ne sont appelees que par le serveur, avec la cle de
 * service. Les laisser ouvertes a authenticated permettrait a n'importe
 * quel compte de s'offrir Atelier Pro depuis la console du navigateur.
 */
const droitsAbonnement = (
  await db.query(`
    select
      has_function_privilege('anon',
        'enregistrer_paiement_abonnement(uuid,text,text,integer,numeric,text)', 'execute') as anon_paie,
      has_function_privilege('authenticated',
        'enregistrer_paiement_abonnement(uuid,text,text,integer,numeric,text)', 'execute') as auth_paie,
      has_function_privilege('authenticated',
        'retrograder_abonnements_expires()', 'execute') as auth_retrograde
  `)
).rows[0];
verifier("G10 anon ne peut pas s offrir un abonnement", droitsAbonnement.anon_paie, false);
verifier("G10 authenticated non plus", droitsAbonnement.auth_paie, false);
verifier("G10 ni retrograder qui que ce soit", droitsAbonnement.auth_retrograde, false);

// G11 : la migration sera collee dans le SQL editor, peut-etre deux fois.
let rejeuAbonnement = null;
try {
  await db.exec(await readFile(resolve(MIGRATIONS, "0013_abonnement.sql"), "utf8"));
} catch (erreur) {
  rejeuAbonnement = erreur.message;
}
verifier("G11 migration rejouable sans erreur", rejeuAbonnement, null);
verifier(
  "G11 les versements survivent au rejeu",
  await compter(`select count(*) n from paiements_abonnement where atelier_id = $1`, [
    atelierAbonne,
  ]),
  3
);

// =========================================================================
console.log("\nH. Langue de l'atelier\n");
// =========================================================================

const parlant = await inscrire({
  email: "parlant@atelier.bj",
  meta: { atelier_nom: "Atelier Parlant", nom: "Ama" },
});
const atelierParlant = (
  await db.query(`select atelier_id from utilisateurs where id = $1`, [parlant.id])
).rows[0].atelier_id;

const langueDe = async (id = atelierParlant) =>
  (await db.query(`select langue from ateliers where id = $1`, [id])).rows[0].langue;

verifier("H1 un atelier neuf est en francais", await langueDe(), "fr");

/*
 * Le defaut vaut pour les ateliers anterieurs a la migration : aucun ne
 * doit changer de langue parce qu'une colonne est apparue.
 */
verifier(
  "H1 et tous les ateliers existants aussi",
  await compter(`select count(*) n from ateliers where langue <> 'fr'`),
  0
);

const poserLangue = async (valeur) => {
  try {
    await db.query(`update ateliers set langue = $1 where id = $2`, [
      valeur,
      atelierParlant,
    ]);
    return null;
  } catch (erreur) {
    return erreur.message;
  }
};

verifier("H2 l anglais est accepte", await poserLangue("en"), null);
verifier("H2 et enregistre", await langueDe(), "en");
verifier("H3 le francais revient", await poserLangue("fr"), null);

/*
 * La contrainte est le coeur de cette migration. Une colonne libre
 * laisserait s'installer un 'FR' ou un 'english' que l'application
 * traiterait en silence comme du francais, et la faute ne se verrait
 * jamais - juste une interface qui refuse de changer de langue.
 */
for (const invalide of ["FR", "en-GB", "english", "es", ""]) {
  verifier(
    `H4 « ${invalide} » est refuse`,
    /ateliers_langue_connue|check constraint/.test((await poserLangue(invalide)) ?? ""),
    true
  );
}
verifier("H4 et la langue n a pas bouge", await langueDe(), "fr");

// H5 : la migration sera collee dans le SQL editor, peut-etre deux fois.
let rejeuLangue = null;
try {
  await db.exec(await readFile(resolve(MIGRATIONS, "0014_langue.sql"), "utf8"));
} catch (erreur) {
  rejeuLangue = erreur.message;
}
verifier("H5 migration rejouable sans erreur", rejeuLangue, null);
verifier("H5 la contrainte tient toujours", /check/.test((await poserLangue("de")) ?? ""), true);

// =========================================================================
console.log(
  `\n${rates === 0 ? `Les ${total} verifications passent.` : `${rates} verification(s) sur ${total} en echec.`}\n`
);
process.exit(rates === 0 ? 0 : 1);
