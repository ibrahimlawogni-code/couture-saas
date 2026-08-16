-- Supprimer un compte laissait son atelier et toutes ses donnees derriere
-- lui, hors d'atteinte : plus aucun utilisateur ne pouvait s'y connecter,
-- mais clients, commandes, paiements et photos restaient stockes.
--
-- Un atelier sans compte est donc marque, puis efface apres un delai de
-- grace. Le delai existe parce qu'une suppression est parfois une erreur,
-- ou le prelude a une reprise par un autre compte : effacer sur-le-champ
-- rendrait la faute irreparable.

alter table ateliers
  add column if not exists orphelin_depuis timestamptz;

comment on column ateliers.orphelin_depuis is
  'Date de disparition du dernier compte. Null tant qu''un compte subsiste.';

create index if not exists idx_ateliers_orphelins
  on ateliers (orphelin_depuis)
  where orphelin_depuis is not null;

-- Le dernier compte part : le compte a rebours demarre.
create or replace function marquer_atelier_orphelin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from utilisateurs where atelier_id = old.atelier_id
  ) then
    update ateliers
       set orphelin_depuis = now()
     where id = old.atelier_id
       and orphelin_depuis is null;
  end if;

  return old;
end;
$$;

-- Un compte rejoint : le compte a rebours s'annule.
create or replace function annuler_atelier_orphelin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update ateliers
     set orphelin_depuis = null
   where id = new.atelier_id
     and orphelin_depuis is not null;

  return new;
end;
$$;

drop trigger if exists trg_utilisateurs_orphelin on utilisateurs;
create trigger trg_utilisateurs_orphelin
  after delete on utilisateurs
  for each row
  execute function marquer_atelier_orphelin();

drop trigger if exists trg_utilisateurs_reprise on utilisateurs;
create trigger trg_utilisateurs_reprise
  after insert on utilisateurs
  for each row
  execute function annuler_atelier_orphelin();

/*
 * Ateliers dont le delai de grace est ecoule.
 *
 * Lister et effacer sont deux fonctions distinctes parce que les photos
 * echappent au SQL : Postgres refuse toute suppression directe dans
 * storage.objects, elle doit passer par l'API Storage. L'appelant lit
 * donc la liste, vide les dossiers <atelier_id>/... du bucket, puis
 * seulement ensuite demande la purge. Dans cet ordre, une interruption
 * laisse des lignes sans photos, situation rattrapee au passage suivant,
 * plutot que des fichiers sans ligne, que plus rien ne designerait.
 */
create or replace function lister_ateliers_a_purger(
  delai interval default interval '30 days'
)
returns table (id uuid, nom text, orphelin_depuis timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.id, a.nom, a.orphelin_depuis
    from ateliers a
   where a.orphelin_depuis is not null
     and a.orphelin_depuis < now() - delai;
$$;

comment on function lister_ateliers_a_purger is
  'Ateliers sans compte depuis plus que le delai donne, candidats a la suppression.';

-- Efface les ateliers listes. La cascade emporte clients, mesures,
-- commandes, paiements, historique et invitations.
create or replace function purger_ateliers_orphelins(
  delai interval default interval '30 days'
)
returns table (id uuid, nom text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  delete from ateliers a
   where a.orphelin_depuis is not null
     and a.orphelin_depuis < now() - delai
  returning a.id, a.nom;
end;
$$;

comment on function purger_ateliers_orphelins is
  'Efface les ateliers sans compte depuis plus que le delai donne. Renvoie ceux qui ont ete effaces.';

-- Les ateliers deja abandonnes avant cette migration entrent dans le cycle.
update ateliers a
   set orphelin_depuis = now()
 where a.orphelin_depuis is null
   and not exists (
     select 1 from utilisateurs u where u.atelier_id = a.id
   );
