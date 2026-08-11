-- Comptes apprentis.
--
-- Creer un compte pour quelqu'un d'autre demanderait des droits
-- d'administration que le navigateur n'a pas. On passe donc par une
-- invitation : le proprietaire genere un code, l'apprenti s'inscrit
-- normalement en le saisissant, et le declencheur le rattache a l'atelier
-- existant au lieu d'en creer un nouveau.

alter table ateliers
  add column if not exists limite_utilisateurs integer not null default 6;

comment on column ateliers.limite_utilisateurs is
  'Proprietaire compris. Six correspond a l''offre avec cinq apprentis.';

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  atelier_id uuid not null references ateliers (id) on delete cascade,
  code text not null unique,
  role text not null default 'apprenti' check (role in ('tailleur', 'apprenti')),
  cree_par uuid references utilisateurs (id) on delete set null,
  utilisee_le timestamptz,
  utilise_par uuid,
  expire_le timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

create index if not exists idx_invitations_atelier on invitations (atelier_id);
create index if not exists idx_invitations_code on invitations (code);

alter table invitations enable row level security;

drop policy if exists "Gerer les invitations de son atelier" on invitations;
create policy "Gerer les invitations de son atelier" on invitations
  for all using (atelier_id = auth_atelier_id())
  with check (atelier_id = auth_atelier_id());

-- Chacun peut voir les membres de son atelier, et le proprietaire peut
-- retirer un apprenti.
drop policy if exists "Retirer un membre de son atelier" on utilisateurs;
create policy "Retirer un membre de son atelier" on utilisateurs
  for delete using (
    atelier_id = auth_atelier_id()
    and id <> auth.uid()
    and exists (
      select 1 from utilisateurs moi
      where moi.id = auth.uid() and moi.role = 'proprietaire'
    )
  );

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  code_saisi text;
  invitation invitations%rowtype;
  nouvel_atelier_id uuid;
  membres integer;
  plafond integer;
begin
  code_saisi := upper(trim(coalesce(new.raw_user_meta_data ->> 'code_invitation', '')));

  if code_saisi <> '' then
    select * into invitation
    from invitations
    where code = code_saisi and utilisee_le is null and expire_le > now()
    limit 1;

    if invitation.id is null then
      raise exception 'code_invitation_invalide';
    end if;

    select count(*) into membres from utilisateurs where atelier_id = invitation.atelier_id;
    select limite_utilisateurs into plafond from ateliers where id = invitation.atelier_id;

    if membres >= plafond then
      raise exception 'atelier_complet';
    end if;

    insert into utilisateurs (id, atelier_id, nom, role)
    values (
      new.id,
      invitation.atelier_id,
      coalesce(nullif(new.raw_user_meta_data ->> 'nom', ''), 'Apprenti'),
      invitation.role
    );

    update invitations
    set utilisee_le = now(), utilise_par = new.id
    where id = invitation.id;

    return new;
  end if;

  -- Sans code, l'inscription ouvre un nouvel atelier.
  insert into ateliers (nom)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'atelier_nom', ''), 'Mon atelier'))
  returning id into nouvel_atelier_id;

  insert into utilisateurs (id, atelier_id, nom, role)
  values (
    new.id,
    nouvel_atelier_id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nom', ''), 'Utilisateur'),
    'proprietaire'
  );

  return new;
end;
$$;
