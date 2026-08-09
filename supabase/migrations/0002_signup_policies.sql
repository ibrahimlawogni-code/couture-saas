-- Permet a un nouvel utilisateur authentifie de creer son atelier
-- et de s'y rattacher lui-meme (flow d'inscription, sans cle secrete)

create policy "Un utilisateur authentifie peut creer un atelier" on ateliers
  for insert
  with check (auth.uid() is not null);

create policy "Un utilisateur peut se rattacher a son atelier" on utilisateurs
  for insert
  with check (id = auth.uid());
