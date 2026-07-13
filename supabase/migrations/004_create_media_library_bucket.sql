-- ============================================================
-- PostSync: Media Library Storage Bucket
-- Migration: 004
-- Run this in the Supabase SQL editor or via CLI
-- ============================================================

-- Create the media-library storage bucket (public URLs for media display)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-library',
  'media-library',
  true,
  104857600, -- 100MB limit
  array[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS policies for media-library bucket
drop policy if exists "Media library users can upload own files" on storage.objects;
drop policy if exists "Media library users can view own files" on storage.objects;
drop policy if exists "Media library users can delete own files" on storage.objects;
drop policy if exists "Public can view media library files" on storage.objects;

create policy "Media library users can upload own files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media-library'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Media library users can view own files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'media-library'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Media library users can delete own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media-library'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access for media display and platform fetches.
create policy "Public can view media library files"
  on storage.objects for select
  to public
  using (bucket_id = 'media-library');
