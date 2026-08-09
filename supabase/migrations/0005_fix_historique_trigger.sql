-- Correctif : le trigger d'historique s'executait avec les droits de
-- l'utilisateur connecte, or historique_statuts n'autorise que la lecture.
-- L'insertion etait donc refusee par RLS et faisait echouer toute creation
-- ou mise a jour de commande.
--
-- L'historique est ecrit par le systeme, jamais directement par un
-- utilisateur : security definer est le bon niveau de privilege ici.

create or replace function log_changement_statut()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') or (new.statut is distinct from old.statut) then
    insert into historique_statuts (commande_id, statut, change_par)
    values (new.id, new.statut, new.cree_par);
  end if;
  return new;
end;
$$;
