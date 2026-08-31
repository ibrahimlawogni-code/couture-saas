-- Abonnement paye.
--
-- Les offres existent sur la page de vente et leurs plafonds sont appliques
-- par 0009, mais rien n'encaissait : passer un atelier a Atelier Pro se
-- faisait a la main dans Supabase. Cette migration pose de quoi le faire
-- depuis un versement reel, sans rien changer aux plafonds eux-memes.

alter table ateliers
  add column if not exists abonnement_jusquau timestamptz;

comment on column ateliers.abonnement_jusquau is
  'Fin de la periode payee. Null sur la formule gratuite, qui n''expire pas.';

/*
 * Les versements recus, un par transaction chez le prestataire.
 *
 * transaction_externe est unique, et c'est tout l'interet de cette table :
 * un webhook se rejoue - le prestataire reessaie quand notre serveur a
 * bronche, et rien n'empeche deux notifications pour un meme paiement. Sans
 * cette contrainte, une echeance serait prolongee deux fois pour un seul
 * versement.
 */
create table if not exists paiements_abonnement (
  id uuid primary key default gen_random_uuid(),
  atelier_id uuid not null references ateliers (id) on delete cascade,
  transaction_externe text not null unique,
  formule text not null references formules (code),
  mois integer not null check (mois > 0),
  montant numeric(12, 2) not null check (montant >= 0),
  devise text not null default 'XOF',
  paye_le timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists paiements_abonnement_atelier_idx
  on paiements_abonnement (atelier_id, paye_le desc);

alter table paiements_abonnement enable row level security;

-- Lecture seule, et seulement sur son propre atelier : un futur ecran
-- d'historique en aura besoin. Personne n'ecrit ici depuis le navigateur.
drop policy if exists "Voir les paiements de son atelier" on paiements_abonnement;
create policy "Voir les paiements de son atelier" on paiements_abonnement
  for select to authenticated
  using (atelier_id = auth_atelier_id());

/*
 * Enregistre un versement et prolonge l'echeance.
 *
 * Idempotente : appelee deux fois avec la meme transaction, elle ne compte
 * qu'une fois. C'est la garantie qui permet au webhook de repondre 200 sans
 * se demander s'il a deja vu ce paiement.
 *
 * L'echeance repart du plus tard entre maintenant et l'echeance en cours :
 * un atelier qui renouvelle avant terme conserve les jours qu'il a payes,
 * et un atelier qui revient apres une interruption ne se voit pas crediter
 * le temps ou il n'etait pas abonne.
 *
 * security definer parce que seul le serveur l'appelle, avec la cle de
 * service : la regle vit ici plutot que dans la route, ou elle serait
 * rejouee a chaque correctif.
 */
create or replace function enregistrer_paiement_abonnement(
  p_atelier uuid,
  p_transaction text,
  p_formule text,
  p_mois integer,
  p_montant numeric,
  p_devise text default 'XOF'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  depart timestamptz;
begin
  if not exists (select 1 from ateliers where id = p_atelier) then
    raise exception 'atelier_inconnu';
  end if;

  if not exists (select 1 from formules where code = p_formule) then
    raise exception 'formule_inconnue';
  end if;

  insert into paiements_abonnement
    (atelier_id, transaction_externe, formule, mois, montant, devise)
  values
    (p_atelier, p_transaction, p_formule, p_mois, p_montant, coalesce(p_devise, 'XOF'))
  on conflict (transaction_externe) do nothing;

  -- Rien d'insere : le versement etait deja connu, l'echeance a deja ete
  -- prolongee. On s'arrete la plutot que de la prolonger une seconde fois.
  if not found then
    return;
  end if;

  select greatest(now(), coalesce(abonnement_jusquau, now()))
    into depart
  from ateliers
  where id = p_atelier;

  update ateliers
     set formule = p_formule,
         abonnement_jusquau = depart + (p_mois || ' months')::interval
   where id = p_atelier;
end;
$$;

revoke all on function enregistrer_paiement_abonnement(uuid, text, text, integer, numeric, text)
  from public, anon, authenticated;

/*
 * Ramene sur la formule gratuite les ateliers dont la periode est finie.
 *
 * Aucune donnee n'est perdue : les plafonds de 0009 ne s'opposent qu'aux
 * creations, jamais aux lignes deja en place. Un atelier qui laisse expirer
 * son abonnement garde ses clients, ses commandes et ses apprentis ; il ne
 * peut simplement plus en ajouter au-dela du gratuit.
 *
 * Appelee par la planification nocturne, avec la purge des ateliers
 * orphelins.
 */
create or replace function retrograder_abonnements_expires()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  touches integer;
begin
  update ateliers
     set formule = 'decouverte',
         abonnement_jusquau = null
   where formule <> 'decouverte'
     and abonnement_jusquau is not null
     and abonnement_jusquau < now();

  get diagnostics touches = row_count;
  return touches;
end;
$$;

revoke all on function retrograder_abonnements_expires()
  from public, anon, authenticated;
