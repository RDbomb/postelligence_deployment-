-- Create a public storage bucket for post media attachments
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Users can upload their own media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'posts'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow public read access (needed so platform APIs can fetch the URL)
create policy "Public read access for media"
  on storage.objects for select
  to public
  using (bucket_id = 'media');

-- Allow users to delete their own uploads
create policy "Users can delete their own media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
