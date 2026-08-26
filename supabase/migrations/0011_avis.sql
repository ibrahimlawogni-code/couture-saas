-- Note laissee par le client apres livraison.
--
-- Le client n'a pas de compte, et n'en aura jamais : lui en demander un
-- pour laisser une note ferait perdre la quasi-totalite des avis. Il arrive
-- donc par un lien porteur d'un jeton, envoye sur WhatsApp avec le recu.
--
-- Le jeton vit sur la commande et non sur le client : il ouvre le droit de
-- noter une piece precise, une seule fois. Un lien qui aurait designe le
-- client aurait laisse noter a volonte, et surtout aurait survecu a la
-- relation - un ancien client garderait indefiniment de quoi peser sur la
-- note de l'atelier.

alter table commandes
  add column if not exists jeton_avis uuid not null default gen_random_uuid();

comment on column commandes.jeton_avis is
  'Porte par le lien de notation. Non devinable, propre a une commande.';

-- Unique : c'est la cle de lecture des deux fonctions ci-dessous, et
-- l'index evite un parcours complet a chaque ouverture d'un lien.
create unique index if not exists idx_commandes_jeton_avis
  on commandes (jeton_avis);

create table if not exists avis (
  id uuid primary key default gen_random_uuid(),
  atelier_id uuid not null references ateliers (id) on delete cascade,
  -- Une commande, un avis. La contrainte tient meme si deux liens sont
  -- ouverts en meme temps sur deux telephones.
  commande_id uuid not null unique references commandes (id) on delete cascade,
  note smallint not null check (note between 1 and 5),
  commentaire text,
  created_at timestamptz not null default now()
);

create index if not exists idx_avis_atelier on avis (atelier_id);

alter table avis enable row level security;

-- L'atelier lit ses avis, et rien d'autre.
--
-- Aucune politique d'ecriture, de modification ni de suppression : les
-- avis n'entrent que par la fonction plus bas. Un atelier qui pourrait
-- effacer une mauvaise note, ou en ecrire une bonne, rendrait le chiffre
-- sans valeur - y compris a ses propres yeux.
drop policy if exists "Voir les avis de son atelier" on avis;
create policy "Voir les avis de son atelier" on avis
  for select using (atelier_id = auth_atelier_id());

-- ============================================================
-- Ce qu'un visiteur muni du jeton peut voir
-- ============================================================
--
-- Le strict necessaire pour qu'il reconnaisse sa commande : le nom de
-- l'atelier et le modele. Ni le prix, ni ce qu'il reste a payer, ni son
-- telephone, ni ses autres commandes. Un lien transfere ou retrouve dans
-- un historique WhatsApp ne doit rien apprendre de plus.
--
-- Seules les commandes livrees repondent : on ne note pas un vetement
-- qu'on n'a pas encore recu.
create or replace function commande_a_noter(jeton uuid)
returns table (atelier text, modele text, deja_note boolean)
language sql
security definer
set search_path = public
stable
as $$
  select a.nom,
         c.nom_modele,
         exists (select 1 from avis where avis.commande_id = c.id)
    from commandes c
    join ateliers a on a.id = c.atelier_id
   where c.jeton_avis = jeton
     and c.statut = 'livre';
$$;

-- ============================================================
-- Deposer la note
-- ============================================================
create or replace function laisser_avis(
  jeton uuid,
  note smallint,
  commentaire text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cible commandes%rowtype;
begin
  if note is null or note < 1 or note > 5 then
    raise exception 'note_invalide';
  end if;

  select * into cible
  from commandes
  where jeton_avis = jeton and statut = 'livre';

  if cible.id is null then
    raise exception 'commande_introuvable';
  end if;

  if exists (select 1 from avis where commande_id = cible.id) then
    raise exception 'deja_note';
  end if;

  insert into avis (atelier_id, commande_id, note, commentaire)
  values (cible.atelier_id, cible.id, note, nullif(trim(commentaire), ''));
end;
$$;

-- Ces deux fonctions sont le seul chemin ouvert aux visiteurs sans compte.
-- Elles s'executent en security definer, donc hors RLS : leur portee tient
-- entierement au jeton et aux filtres ci-dessus.
revoke all on function commande_a_noter(uuid) from public;
revoke all on function laisser_avis(uuid, smallint, text) from public;

grant execute on function commande_a_noter(uuid) to anon, authenticated;
grant execute on function laisser_avis(uuid, smallint, text) to anon, authenticated;
