-- Administrateurs de la plateforme.
--
-- A ne pas confondre avec les roles d'un atelier (proprietaire, tailleur,
-- apprenti), qui disent ce qu'on peut faire chez soi. Un administrateur
-- ici est quelqu'un qui agit sur TailorHub lui-meme : voir les ateliers
-- inscrits, changer l'offre de l'un d'eux quand il a paye.
--
-- Le droit vit sur le compte et non sur l'utilisateur d'un atelier : un
-- administrateur n'a pas forcement d'atelier, et celui qui en a ne doit
-- pas gagner ce pouvoir en changeant de role chez lui.

create table if not exists administrateurs (
  id uuid primary key references auth.users (id) on delete cascade,
  ajoute_par uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table administrateurs is
  'Comptes autorises sur l''arriere-guichet. Voir 0012 pour nommer le premier.';

-- ============================================================
-- Journal
-- ============================================================
--
-- Le patron veut pouvoir deleguer ce pouvoir a un subordonne pendant ses
-- absences. Deleguer sans trace, c'est ne plus savoir qui a fait passer
-- quel atelier a quelle offre - or ce sont des gestes d'argent. Le journal
-- n'est pas un luxe : c'est ce qui rend la delegation possible.
create table if not exists journal_admin (
  id uuid primary key default gen_random_uuid(),
  administrateur uuid references auth.users (id) on delete set null,
  action text not null,
  atelier_id uuid references ateliers (id) on delete set null,
  compte_cible uuid references auth.users (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_journal_admin_date
  on journal_admin (created_at desc);

-- ============================================================
-- Cloison
-- ============================================================
--
-- RLS active, et volontairement aucune politique : ni le navigateur d'un
-- tailleur ni celui d'un administrateur ne lit ces deux tables. Elles ne
-- sont touchees que par le serveur, avec la cle de service, depuis
-- l'arriere-guichet.
--
-- C'est ce qui garde intacte la cloison multi-atelier : le pouvoir
-- d'administration n'ouvre aucun nouveau chemin de lecture sur clients,
-- commandes ou paiements. Une faille dans l'ecran d'administration ne peut
-- pas devenir une fuite de donnees entre ateliers.
alter table administrateurs enable row level security;
alter table journal_admin enable row level security;

-- ============================================================
-- Qui est administrateur
-- ============================================================
--
-- security definer, donc hors RLS : sans cela, une politique posee sur
-- administrateurs qui interrogerait administrateurs tournerait en rond.
-- Meme motif que auth_atelier_id() dans 0001.
create or replace function est_administrateur(compte uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from administrateurs where id = compte);
$$;

-- ============================================================
-- Changer l'offre d'un atelier
-- ============================================================
--
-- Le geste qui remplace l'encaissement automatique tant que le compte
-- marchand n'est pas ouvert : un atelier paie par Mobile Money, on le
-- passe a son offre a la main.
--
-- L'appelant est passe en parametre plutot que lu dans auth.uid() : la
-- fonction est appelee par le serveur avec la cle de service, qui n'a pas
-- de session. Elle verifie donc elle-meme que ce compte est bien
-- administrateur, au lieu de faire confiance a l'appelant.
create or replace function admin_changer_formule(
  atelier uuid,
  nouvelle_formule text,
  par uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ancienne text;
begin
  if not est_administrateur(par) then
    raise exception 'non_administrateur';
  end if;

  if not exists (select 1 from formules where code = nouvelle_formule) then
    raise exception 'formule_inconnue';
  end if;

  select formule into ancienne from ateliers where id = atelier;

  if ancienne is null then
    raise exception 'atelier_introuvable';
  end if;

  -- Rien a journaliser si rien ne change : un double clic ne doit pas
  -- laisser deux lignes qui racontent un changement qui n'a pas eu lieu.
  if ancienne = nouvelle_formule then
    return;
  end if;

  update ateliers set formule = nouvelle_formule where id = atelier;

  insert into journal_admin (administrateur, action, atelier_id, details)
  values (
    par,
    'formule',
    atelier,
    jsonb_build_object('avant', ancienne, 'apres', nouvelle_formule)
  );
end;
$$;

-- ============================================================
-- Nommer et revoquer un administrateur
-- ============================================================
create or replace function admin_nommer(compte uuid, par uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not est_administrateur(par) then
    raise exception 'non_administrateur';
  end if;

  if not exists (select 1 from auth.users where id = compte) then
    raise exception 'compte_introuvable';
  end if;

  insert into administrateurs (id, ajoute_par)
  values (compte, par)
  on conflict (id) do nothing;

  insert into journal_admin (administrateur, action, compte_cible)
  values (par, 'nommer', compte);
end;
$$;

create or replace function admin_revoquer(compte uuid, par uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not est_administrateur(par) then
    raise exception 'non_administrateur';
  end if;

  -- Se revoquer soi-meme est interdit, et cette seule regle suffit a
  -- garantir qu'il reste toujours au moins un administrateur : le dernier
  -- ne peut pas se retirer, et personne d'autre ne peut le faire a sa
  -- place puisqu'il faut deja l'etre pour revoquer.
  if compte = par then
    raise exception 'auto_revocation';
  end if;

  delete from administrateurs where id = compte;

  insert into journal_admin (administrateur, action, compte_cible)
  values (par, 'revoquer', compte);
end;
$$;

-- ============================================================
-- Droits
-- ============================================================
--
-- Rien n'est ouvert a anon ni a authenticated : ces fonctions ne
-- s'appellent que depuis le serveur, avec la cle de service. Les exposer
-- au navigateur laisserait n'importe quel compte connecte tenter un appel
-- et decouvrir, a la reponse, s'il est administrateur ou non.
revoke all on function est_administrateur(uuid) from public;
revoke all on function admin_changer_formule(uuid, text, uuid) from public;
revoke all on function admin_nommer(uuid, uuid) from public;
revoke all on function admin_revoquer(uuid, uuid) from public;

-- ============================================================
-- Nommer le premier administrateur
-- ============================================================
--
-- Volontairement absent de cette migration.
--
-- Y inscrire une adresse la ferait entrer dans le depot, et surtout
-- rejouer la migration ressusciterait un droit qu'on aurait retire. Le
-- premier administrateur se nomme une fois, a la main, dans le SQL editor
-- de Supabase :
--
--   insert into administrateurs (id)
--   select id from auth.users where email = 'votre@adresse'
--   on conflict do nothing;
--
-- Les suivants se nomment depuis l'ecran d'administration.
