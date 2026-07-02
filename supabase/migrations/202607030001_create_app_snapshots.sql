create table if not exists public.app_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_snapshots enable row level security;

drop policy if exists "Users can manage their own app snapshot"
on public.app_snapshots;

create policy "Users can manage their own app snapshot"
on public.app_snapshots
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete
on table public.app_snapshots
to authenticated;
