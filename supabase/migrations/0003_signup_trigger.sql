-- L'atelier et le profil utilisateur sont desormais crees par un trigger
-- serveur au moment de l'inscription, et non plus par le client.
-- Cela fonctionne meme quand la confirmation email est active (pas encore
-- de session cote client a ce moment la) et evite des policies permissives.

drop policy if exists "Un utilisateur authentifie peut creer un atelier" on ateliers;
drop policy if exists "Un utilisateur peut se rattacher a son atelier" on utilisateurs;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nouvel_atelier_id uuid;
begin
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
