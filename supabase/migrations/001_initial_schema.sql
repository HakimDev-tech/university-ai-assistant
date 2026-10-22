-- Margin / clean-install schema
-- PostgreSQL + Supabase Auth + Storage + pgvector.
-- Review against any existing project before applying to a database with real data.

create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  storage_path text not null unique,
  status text not null default 'en_attente'
    check (status in ('en_attente', 'traitement_en_cours', 'traite', 'erreur')),
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  chunk_index integer not null check (chunk_index >= 0),
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  title text not null default 'Untitled study thread',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  client_message_id text,
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null check (sender in ('user', 'assistant')),
  content text not null,
  source_chunk_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create unique index if not exists chat_messages_client_message_id_unique
  on public.chat_messages(client_message_id)
  where client_message_id is not null;
create index if not exists documents_user_created_idx on public.documents(user_id, created_at desc);
create index if not exists chunks_document_order_idx on public.document_chunks(document_id, chunk_index);
create index if not exists chunks_user_document_idx on public.document_chunks(user_id, document_id);
create index if not exists chunks_embedding_hnsw_idx
  on public.document_chunks using hnsw (embedding extensions.vector_cosine_ops);
create index if not exists sessions_user_updated_idx on public.chat_sessions(user_id, updated_at desc);
create index if not exists messages_session_created_idx on public.chat_messages(session_id, created_at);
create index if not exists messages_user_created_idx on public.chat_messages(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at before update on public.documents
for each row execute function public.set_updated_at();
drop trigger if exists sessions_set_updated_at on public.chat_sessions;
create trigger sessions_set_updated_at before update on public.chat_sessions
for each row execute function public.set_updated_at();

create or replace function public.touch_session_on_message()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.chat_sessions
  set updated_at = now()
  where id = new.session_id and user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists chat_messages_touch_session on public.chat_messages;
create trigger chat_messages_touch_session after insert on public.chat_messages
for each row execute function public.touch_session_on_message();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own" on public.documents for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own" on public.documents for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "chunks_select_own" on public.document_chunks;
create policy "chunks_select_own" on public.document_chunks for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "chunks_insert_own" on public.document_chunks;
create policy "chunks_insert_own" on public.document_chunks for insert to authenticated
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.documents d where d.id = document_id and d.user_id = (select auth.uid())
));
drop policy if exists "chunks_delete_own" on public.document_chunks;
create policy "chunks_delete_own" on public.document_chunks for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "sessions_select_own" on public.chat_sessions;
create policy "sessions_select_own" on public.chat_sessions for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "sessions_insert_own" on public.chat_sessions;
create policy "sessions_insert_own" on public.chat_sessions for insert to authenticated
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.documents d where d.id = document_id and d.user_id = (select auth.uid())
));
drop policy if exists "sessions_update_own" on public.chat_sessions;
create policy "sessions_update_own" on public.chat_sessions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "sessions_delete_own" on public.chat_sessions;
create policy "sessions_delete_own" on public.chat_sessions for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "messages_select_own" on public.chat_messages;
create policy "messages_select_own" on public.chat_messages for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "messages_insert_own" on public.chat_messages;
create policy "messages_insert_own" on public.chat_messages for insert to authenticated
with check (
  user_id = (select auth.uid())
  and sender = 'user'
  and exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = (select auth.uid()))
);

-- The function deliberately checks auth.uid() itself. Callers cannot pass another
-- user's ID to bypass the owner boundary. SECURITY INVOKER preserves RLS.
create or replace function public.match_documents(
  query_embedding extensions.vector(768),
  target_user_id uuid,
  target_document_id uuid,
  match_threshold float,
  match_count int
)
returns table(chunk_id uuid, content text, chunk_index integer, similarity float)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.uid() <> target_user_id then
    raise exception 'not authorized';
  end if;
  if match_count < 1 or match_count > 12 then
    raise exception 'invalid match_count';
  end if;
  return query
    select c.id, c.content, c.chunk_index,
      (1 - (c.embedding <=> query_embedding))::float as similarity
    from public.document_chunks c
    join public.documents d on d.id = c.document_id
    where c.user_id = target_user_id
      and c.document_id = target_document_id
      and d.user_id = target_user_id
      and (1 - (c.embedding <=> query_embedding)) >= match_threshold
    order by c.embedding <=> query_embedding
    limit match_count;
end;
$$;

revoke all on function public.match_documents(extensions.vector, uuid, uuid, float, int) from public, anon;
grant execute on function public.match_documents(extensions.vector, uuid, uuid, float, int) to authenticated;

-- Private document bucket. Storage objects are namespaced by auth.uid().
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 31457280, array['application/pdf', 'text/plain'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "document_storage_insert_own" on storage.objects;
create policy "document_storage_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "document_storage_select_own" on storage.objects;
create policy "document_storage_select_own" on storage.objects for select to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "document_storage_delete_own" on storage.objects;
create policy "document_storage_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
