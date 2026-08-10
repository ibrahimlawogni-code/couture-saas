-- Renommer son atelier et son profil etait impossible : seule la lecture
-- etait autorisee. Un atelier restait donc bloque sur le nom pose a
-- l'inscription, et sur "Utilisateur" quand le compte avait ete cree
-- depuis le tableau de bord.

drop policy if exists "Modifier son propre atelier" on ateliers;
drop policy if exists "Modifier son propre profil" on utilisateurs;

create policy "Modifier son propre atelier" on ateliers
  for update using (id = auth_atelier_id())
  with check (id = auth_atelier_id());

create policy "Modifier son propre profil" on utilisateurs
  for update using (id = auth.uid())
  with check (id = auth.uid());
