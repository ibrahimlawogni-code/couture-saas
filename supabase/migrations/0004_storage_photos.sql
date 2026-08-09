-- Stockage des photos de modele et de tissu.
-- Bucket prive : les fichiers sont ranges sous <atelier_id>/... et
-- servis via des URLs signees, jamais en acces public.

insert into storage.buckets (id, name, public)
values ('commandes', 'commandes', false)
on conflict (id) do nothing;

drop policy if exists "Lire les photos de son atelier" on storage.objects;
drop policy if exists "Uploader les photos de son atelier" on storage.objects;
drop policy if exists "Supprimer les photos de son atelier" on storage.objects;

create policy "Lire les photos de son atelier" on storage.objects
  for select using (
    bucket_id = 'commandes'
    and (storage.foldername(name))[1] = auth_atelier_id()::text
  );

create policy "Uploader les photos de son atelier" on storage.objects
  for insert with check (
    bucket_id = 'commandes'
    and (storage.foldername(name))[1] = auth_atelier_id()::text
  );

create policy "Supprimer les photos de son atelier" on storage.objects
  for delete using (
    bucket_id = 'commandes'
    and (storage.foldername(name))[1] = auth_atelier_id()::text
  );
