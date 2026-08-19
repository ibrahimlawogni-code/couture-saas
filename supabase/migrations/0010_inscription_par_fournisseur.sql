-- Inscription par fournisseur externe (Google).
--
-- handle_new_user() cree l'atelier a partir des metadonnees que le
-- formulaire depose au moment de signUp : atelier_nom, nom, code_invitation.
-- Une inscription Google n'en depose aucune. Le nom de l'atelier et le code
-- d'invitation n'existent tout simplement pas encore quand le compte est
-- cree : la personne revient de chez Google, pas d'un formulaire.
--
-- Sans garde, deux degats :
--
--   - tout compte Google ouvrirait un atelier nomme « Mon atelier », par le
--     repli du coalesce ;
--   - pire, un apprenti invite tomberait dans la branche « sans code » et
--     deviendrait proprietaire d'un atelier neuf et vide, au lieu de
--     rejoindre celui de son patron. La panne serait silencieuse.
--
-- Le declencheur laisse donc passer ces comptes sans rien creer, et
-- terminer_inscription() acheve le travail depuis l'ecran de bienvenue, une
-- fois la personne connectee et le nom de l'atelier connu.
--
-- Le parcours par email est inchange : la garde se contente de le preceder.

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
  -- Fournisseur externe : rien a creer ici. Le defaut a 'email' vaut pour
  -- les comptes anterieurs a cette migration, dont raw_app_meta_data
  -- pourrait ne rien porter.
  if coalesce(new.raw_app_meta_data ->> 'provider', 'email') <> 'email' then
    return new;
  end if;

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

/*
 * Termine une inscription que le declencheur a laissee sans atelier.
 *
 * Memes regles que lui, appliquees a la personne connectee plutot qu'a la
 * ligne inseree : creer un atelier, ou en rejoindre un sur code, avec le
 * meme plafond de membres et les memes messages d'echec - que
 * messageAuth() traduit deja.
 *
 * security definer parce que les politiques d'ecriture sur ateliers ont ete
 * retirees en 0003, volontairement : le navigateur n'a pas le droit
 * d'inserer un atelier, et il ne faut pas le lui rendre pour si peu.
 *
 * Les parametres portent des noms qui ne sont ceux d'aucune colonne
 * touchee ici : un parametre nomme « nom » rendrait ambigu le « nom » des
 * insertions qui suivent.
 */
create or replace function terminer_inscription(
  atelier_nom text default '',
  nom_utilisateur text default '',
  code_invitation text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  moi uuid := auth.uid();
  code_saisi text;
  invitation invitations%rowtype;
  nouvel_atelier_id uuid;
  membres integer;
  plafond integer;
  nom_retenu text;
begin
  if moi is null then
    raise exception 'non_authentifie';
  end if;

  /*
   * Deja rattache : ne rien faire, et surtout ne pas ouvrir un second
   * atelier. Un double envoi du formulaire, un retour arriere ou un
   * rechargement ne doivent pas couter un atelier fantome - c'est
   * exactement le degat que cette migration existe pour eviter.
   */
  if exists (select 1 from utilisateurs where id = moi) then
    return;
  end if;

  -- Le nom saisi l'emporte ; a defaut celui que le fournisseur a transmis.
  select coalesce(
           nullif(trim(nom_utilisateur), ''),
           nullif(u.raw_user_meta_data ->> 'full_name', ''),
           nullif(u.raw_user_meta_data ->> 'name', ''),
           'Utilisateur'
         )
    into nom_retenu
  from auth.users u
  where u.id = moi;

  code_saisi := upper(trim(coalesce(code_invitation, '')));

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
    values (moi, invitation.atelier_id, nom_retenu, invitation.role);

    update invitations
    set utilisee_le = now(), utilise_par = moi
    where id = invitation.id;

    return;
  end if;

  insert into ateliers (nom)
  values (coalesce(nullif(trim(atelier_nom), ''), 'Mon atelier'))
  returning id into nouvel_atelier_id;

  insert into utilisateurs (id, atelier_id, nom, role)
  values (moi, nouvel_atelier_id, nom_retenu, 'proprietaire');
end;
$$;

-- Une fonction security definer est executable par tous par defaut. Seule
-- une personne connectee doit pouvoir s'ouvrir un atelier.
revoke all on function terminer_inscription(text, text, text) from public, anon;
grant execute on function terminer_inscription(text, text, text) to authenticated;
