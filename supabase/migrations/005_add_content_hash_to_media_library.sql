-- Add content_hash column to media_library for deduplication
alter table public.media_library
  add column if not exists content_hash text;

-- Index for fast duplicate lookup
create index if not exists media_library_content_hash_idx
  on public.media_library(user_id, content_hash);
