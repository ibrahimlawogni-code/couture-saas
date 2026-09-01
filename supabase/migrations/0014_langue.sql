-- Langue de l'atelier.
--
-- Portee par l'atelier et non par le compte : les documents qui sortent -
-- recus, messages WhatsApp - doivent suivre la meme langue quel que soit
-- l'apprenti qui les produit. Un client qui recoit un recu en francais un
-- jour et en anglais le lendemain ne saurait plus a qui il a affaire.
--
-- Le defaut vaut 'fr' : c'est la langue de tous les ateliers existants, et
-- la colonne ne doit rien changer pour eux.
--
-- La contrainte enumere les langues servies. Elle est volontaire : une
-- valeur libre laisserait s'installer un 'FR', un 'fr-BJ' ou un 'english'
-- que l'application traiterait en silence comme du francais.

alter table ateliers
  add column if not exists langue text not null default 'fr';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ateliers_langue_connue'
  ) then
    alter table ateliers
      add constraint ateliers_langue_connue check (langue in ('fr', 'en'));
  end if;
end $$;

comment on column ateliers.langue is
  'Langue de l''interface et des documents de l''atelier. fr ou en.';
