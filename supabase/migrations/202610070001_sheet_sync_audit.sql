create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_id uuid not null,
  source_key text not null default '',
  source_tab text not null default '',
  source_row integer,
  status text not null check (status in ('imported', 'unchanged', 'conflict', 'error', 'skipped')),
  message text not null default '',
  created_at timestamptz not null default now()
);

alter table public.leads
  add column if not exists source_hash text not null default '',
  add column if not exists source_tab text not null default '';

create index if not exists sync_logs_created_at_idx
  on public.sync_logs (created_at desc);
create index if not exists sync_logs_sync_id_idx
  on public.sync_logs (sync_id, created_at);
create index if not exists sync_logs_source_key_idx
  on public.sync_logs (source_key, created_at desc);

alter table public.sync_logs enable row level security;

drop policy if exists "Authenticated team can read sync logs" on public.sync_logs;
create policy "Authenticated team can read sync logs"
  on public.sync_logs for select to authenticated using (true);

grant select on public.sync_logs to authenticated;
grant insert on public.sync_logs to service_role;
