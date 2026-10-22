-- Margin conversation branches: immutable prompt history and independent continuations.
alter table public.chat_sessions
  add column if not exists default_branch_id uuid;

create table if not exists public.chat_branches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_branch_id uuid references public.chat_branches(id) on delete set null,
  forked_from_message_id uuid,
  created_at timestamptz not null default now()
);

alter table public.chat_messages
  add column if not exists branch_id uuid references public.chat_branches(id) on delete cascade;

-- Give each existing session one stable original branch and preserve its messages.
insert into public.chat_branches (session_id, user_id, name)
select s.id, s.user_id, 'Version 1'
from public.chat_sessions s
where not exists (select 1 from public.chat_branches b where b.session_id = s.id);

update public.chat_sessions s
set default_branch_id = b.id
from public.chat_branches b
where b.session_id = s.id and b.name = 'Version 1' and s.default_branch_id is null;

update public.chat_messages m
set branch_id = s.default_branch_id
from public.chat_sessions s
where m.session_id = s.id and m.branch_id is null;

alter table public.chat_messages
  alter column branch_id set not null;

create index if not exists branches_session_created_idx
  on public.chat_branches(session_id, created_at asc);
create index if not exists messages_branch_created_idx
  on public.chat_messages(branch_id, created_at asc);

alter table public.chat_branches enable row level security;
drop policy if exists "branches_select_own" on public.chat_branches;
create policy "branches_select_own" on public.chat_branches for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "branches_insert_own" on public.chat_branches;
create policy "branches_insert_own" on public.chat_branches for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = (select auth.uid()))
);
drop policy if exists "branches_update_own" on public.chat_branches;
create policy "branches_update_own" on public.chat_branches for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "branches_delete_own" on public.chat_branches;
create policy "branches_delete_own" on public.chat_branches for delete to authenticated
using (user_id = (select auth.uid()));

-- Ensure the default branch reference cannot point to a branch from another session.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chat_sessions_default_branch_fk'
  ) then
    alter table public.chat_sessions
      add constraint chat_sessions_default_branch_fk
      foreign key (default_branch_id) references public.chat_branches(id) on delete set null;
  end if;
end $$;
