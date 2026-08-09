-- Schema initial : SaaS Ateliers de Couture
-- Multi-tenant : chaque atelier est isole via RLS sur atelier_id

create extension if not exists "pgcrypto";

-- ============================================================
-- ATELIERS (tenant)
-- ============================================================
create table ateliers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  telephone text,
  whatsapp_number text,
  adresse text,
  plan_abonnement text not null default 'essai',
  created_at timestamptz not null default now()
);

-- ============================================================
-- UTILISATEURS (staff, lie a auth.users de Supabase)
-- ============================================================
create table utilisateurs (
  id uuid primary key references auth.users (id) on delete cascade,
  atelier_id uuid not null references ateliers (id) on delete cascade,
  nom text not null,
  telephone text,
  role text not null default 'tailleur' check (role in ('proprietaire', 'tailleur', 'apprenti')),
  created_at timestamptz not null default now()
);

create index idx_utilisateurs_atelier on utilisateurs (atelier_id);

-- ============================================================
-- CLIENTS
-- ============================================================
create table clients (
  id uuid primary key default gen_random_uuid(),
  atelier_id uuid not null references ateliers (id) on delete cascade,
  nom text not null,
  telephone text,
  whatsapp text,
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_clients_atelier on clients (atelier_id);

-- ============================================================
-- GABARITS DE MESURE (modeles reutilisables par type de vetement)
-- ============================================================
create table gabarits_mesure (
  id uuid primary key default gen_random_uuid(),
  atelier_id uuid not null references ateliers (id) on delete cascade,
  nom text not null,
  champs jsonb not null default '[]'::jsonb, -- ex: [{"nom": "poitrine", "unite": "cm"}, ...]
  created_at timestamptz not null default now()
);

create index idx_gabarits_atelier on gabarits_mesure (atelier_id);

-- ============================================================
-- MESURES (releve pour un client a un instant T)
-- ============================================================
create table mesures (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  gabarit_id uuid references gabarits_mesure (id) on delete set null,
  libelle text not null default 'Mesures',
  valeurs jsonb not null default '{}'::jsonb, -- ex: {"poitrine": 98, "taille": 82, "custom_manche_longue": 61}
  pris_par uuid references utilisateurs (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_mesures_client on mesures (client_id);

-- ============================================================
-- COMMANDES
-- ============================================================
create table commandes (
  id uuid primary key default gen_random_uuid(),
  atelier_id uuid not null references ateliers (id) on delete cascade,
  client_id uuid not null references clients (id) on delete restrict,
  mesure_id uuid references mesures (id) on delete set null, -- snapshot au moment de la commande
  nom_modele text,
  photo_modele_url text,
  photo_tissu_url text,
  prix_total numeric(12, 2) not null default 0,
  date_essayage date,
  date_livraison date,
  statut text not null default 'recu' check (
    statut in ('recu', 'coupe', 'couture', 'essayage', 'finitions', 'pret', 'livre')
  ),
  cree_par uuid references utilisateurs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_commandes_atelier on commandes (atelier_id);
create index idx_commandes_client on commandes (client_id);
create index idx_commandes_statut on commandes (statut);
create index idx_commandes_date_livraison on commandes (date_livraison);

-- ============================================================
-- HISTORIQUE DES STATUTS (timeline Kanban + audit)
-- ============================================================
create table historique_statuts (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references commandes (id) on delete cascade,
  statut text not null,
  change_par uuid references utilisateurs (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_historique_commande on historique_statuts (commande_id);

-- ============================================================
-- PAIEMENTS
-- ============================================================
create table paiements (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references commandes (id) on delete cascade,
  montant numeric(12, 2) not null,
  type text not null default 'acompte' check (type in ('acompte', 'solde', 'complement')),
  methode text default 'especes' check (methode in ('especes', 'mobile_money', 'virement')),
  recu_url text,
  created_at timestamptz not null default now()
);

create index idx_paiements_commande on paiements (commande_id);

-- ============================================================
-- NOTIFICATIONS (log des messages WhatsApp)
-- ============================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid references commandes (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  type text not null check (type in ('confirmation', 'rappel_essayage', 'pret_a_retirer')),
  canal text not null default 'whatsapp',
  statut text not null default 'en_attente' check (statut in ('en_attente', 'envoye', 'echec')),
  created_at timestamptz not null default now()
);

create index idx_notifications_commande on notifications (commande_id);

-- ============================================================
-- TRIGGER : updated_at auto sur commandes
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_commandes_updated_at
  before update on commandes
  for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER : log automatique dans historique_statuts au changement de statut
-- ============================================================
create or replace function log_changement_statut()
returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.statut is distinct from old.statut) then
    insert into historique_statuts (commande_id, statut, change_par)
    values (new.id, new.statut, new.cree_par);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_commandes_log_statut
  after insert or update on commandes
  for each row execute function log_changement_statut();

-- ============================================================
-- ROW LEVEL SECURITY : isolation multi-tenant
-- Chaque utilisateur ne voit que les donnees de son propre atelier
-- ============================================================
alter table ateliers enable row level security;
alter table utilisateurs enable row level security;
alter table clients enable row level security;
alter table gabarits_mesure enable row level security;
alter table mesures enable row level security;
alter table commandes enable row level security;
alter table historique_statuts enable row level security;
alter table paiements enable row level security;
alter table notifications enable row level security;

-- Fonction utilitaire : atelier_id de l'utilisateur connecte
create or replace function auth_atelier_id()
returns uuid as $$
  select atelier_id from utilisateurs where id = auth.uid();
$$ language sql stable security definer;

create policy "Voir son propre atelier" on ateliers
  for select using (id = auth_atelier_id());

create policy "Voir les utilisateurs de son atelier" on utilisateurs
  for select using (atelier_id = auth_atelier_id());

create policy "CRUD clients de son atelier" on clients
  for all using (atelier_id = auth_atelier_id())
  with check (atelier_id = auth_atelier_id());

create policy "CRUD gabarits de son atelier" on gabarits_mesure
  for all using (atelier_id = auth_atelier_id())
  with check (atelier_id = auth_atelier_id());

create policy "CRUD mesures de son atelier" on mesures
  for all using (
    client_id in (select id from clients where atelier_id = auth_atelier_id())
  )
  with check (
    client_id in (select id from clients where atelier_id = auth_atelier_id())
  );

create policy "CRUD commandes de son atelier" on commandes
  for all using (atelier_id = auth_atelier_id())
  with check (atelier_id = auth_atelier_id());

create policy "Voir historique de son atelier" on historique_statuts
  for select using (
    commande_id in (select id from commandes where atelier_id = auth_atelier_id())
  );

create policy "CRUD paiements de son atelier" on paiements
  for all using (
    commande_id in (select id from commandes where atelier_id = auth_atelier_id())
  )
  with check (
    commande_id in (select id from commandes where atelier_id = auth_atelier_id())
  );

create policy "CRUD notifications de son atelier" on notifications
  for all using (
    client_id in (select id from clients where atelier_id = auth_atelier_id())
  )
  with check (
    client_id in (select id from clients where atelier_id = auth_atelier_id())
  );
