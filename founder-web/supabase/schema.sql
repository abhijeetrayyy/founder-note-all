-- FounderOS sync — run this once in a Supabase project's SQL editor.
--
-- The app keeps everything on the device; this is only the copy that lets a
-- phone and a laptop share one list. One table, one function:
--
--   fos_records  every task and note, as the JSON the app already uses.
--   fos_push     upserts a batch, keeping whichever copy was edited last.
--
-- Safe to run again. Does not touch any other table, so it can live alongside
-- the old FounderOS schema in the same project.

create table if not exists public.fos_records (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null,
  kind       text        not null check (kind in ('task', 'note')),
  data       jsonb       not null,
  -- When the record was last edited, by the device that edited it. Last write wins.
  updated_at timestamptz not null,
  -- When the server last accepted a change to it. Devices pull by this.
  synced_at  timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create index if not exists fos_records_pull on public.fos_records (user_id, synced_at);

alter table public.fos_records enable row level security;

drop policy if exists "fos_records_own" on public.fos_records;
create policy "fos_records_own" on public.fos_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.fos_push(recs jsonb)
returns integer
language sql
security invoker
set search_path = public
as $$
  with incoming as (
    select r->>'id'                       as id,
           r->>'kind'                     as kind,
           r->'data'                      as data,
           (r->>'updated_at')::timestamptz as updated_at
      from jsonb_array_elements(recs) as r
  ), written as (
    insert into public.fos_records as f (user_id, id, kind, data, updated_at, synced_at)
    select auth.uid(), id, kind, data, updated_at, clock_timestamp() from incoming
    on conflict (user_id, id) do update
       set kind = excluded.kind,
           data = excluded.data,
           updated_at = excluded.updated_at,
           synced_at = clock_timestamp()
     -- An older copy arriving late never overwrites a newer one.
     where f.updated_at < excluded.updated_at
    returning 1
  )
  select count(*)::int from written;
$$;

grant execute on function public.fos_push(jsonb) to authenticated;
