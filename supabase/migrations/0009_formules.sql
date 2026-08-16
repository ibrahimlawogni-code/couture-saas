-- Les limites annoncees sur la page de tarifs n'etaient appliquees nulle
-- part. Elles le sont ici, dans la base, et pas dans l'interface : les
-- ecritures partent du navigateur pour permettre le hors ligne, un
-- controle cote client se contournerait donc en ouvrant la console.

create table if not exists formules (
  code text primary key,
  nom text not null,
  -- null vaut illimite
  max_clients int,
  max_commandes_en_cours int,
  max_comptes int not null
);

insert into formules (code, nom, max_clients, max_commandes_en_cours, max_comptes)
values
  ('decouverte',  'Découverte', 5,    5,    1),
  ('atelier',     'Atelier',    null, null, 1),
  ('atelier_pro', 'Atelier Pro', null, null, 6)
on conflict (code) do update
   set nom = excluded.nom,
       max_clients = excluded.max_clients,
       max_commandes_en_cours = excluded.max_commandes_en_cours,
       max_comptes = excluded.max_comptes;

alter table ateliers
  add column if not exists formule text not null default 'decouverte'
    references formules (code);

-- limite_utilisateurs existait deja et sert a l'acceptation des
-- invitations. Elle suit maintenant la formule, pour qu'il n'y ait qu'un
-- seul endroit ou decider de ce a quoi un atelier a droit.
create or replace function appliquer_limites_formule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select f.max_comptes into new.limite_utilisateurs
    from formules f
   where f.code = new.formule;

  return new;
end;
$$;

drop trigger if exists trg_ateliers_formule on ateliers;
create trigger trg_ateliers_formule
  before insert or update of formule on ateliers
  for each row
  execute function appliquer_limites_formule();

-- Ajouter la colonne avec une valeur par defaut ne declenche rien : les
-- ateliers deja en base doivent repasser par le calcul.
update ateliers set formule = formule;

-- Formule gratuite : cinq clients.
create or replace function verifier_limite_clients()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plafond int;
  actuels int;
begin
  select f.max_clients into plafond
    from ateliers a
    join formules f on f.code = a.formule
   where a.id = new.atelier_id;

  if plafond is null then
    return new;
  end if;

  select count(*) into actuels
    from clients
   where atelier_id = new.atelier_id;

  if actuels >= plafond then
    raise exception 'limite_clients_atteinte'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

/*
 * Formule gratuite : cinq commandes en cours.
 *
 * La page de tarifs dit "en cours", pas "au total" : une commande livree
 * ne compte plus, et l'atelier peut donc continuer a travailler sans
 * jamais rien effacer. Le controle vaut aussi au retour d'une commande
 * livree vers un statut actif, sans quoi il suffirait d'un aller-retour
 * pour depasser le plafond.
 */
create or replace function verifier_limite_commandes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plafond int;
  actuelles int;
begin
  if tg_op = 'UPDATE' and not (old.statut = 'livre' and new.statut <> 'livre') then
    return new;
  end if;

  if new.statut = 'livre' then
    return new;
  end if;

  select f.max_commandes_en_cours into plafond
    from ateliers a
    join formules f on f.code = a.formule
   where a.id = new.atelier_id;

  if plafond is null then
    return new;
  end if;

  select count(*) into actuelles
    from commandes
   where atelier_id = new.atelier_id
     and statut <> 'livre'
     and id <> new.id;

  if actuelles >= plafond then
    raise exception 'limite_commandes_atteinte'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_clients_limite on clients;
create trigger trg_clients_limite
  before insert on clients
  for each row
  execute function verifier_limite_clients();

drop trigger if exists trg_commandes_limite on commandes;
create trigger trg_commandes_limite
  before insert or update of statut on commandes
  for each row
  execute function verifier_limite_commandes();

-- Lecture des formules par toute personne connectee : l'application
-- affiche le plafond restant et doit connaitre les paliers.
alter table formules enable row level security;

drop policy if exists "Lire les formules" on formules;
create policy "Lire les formules" on formules
  for select to authenticated using (true);
