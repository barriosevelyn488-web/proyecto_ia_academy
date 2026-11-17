create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  activity_type text not null check (activity_type in ('whatsapp_opened', 'note', 'task')),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists lead_activities_lead_created_idx
  on public.lead_activities (lead_id, created_at desc);

alter table public.lead_activities enable row level security;

drop policy if exists "Authenticated team can read lead activities" on public.lead_activities;
create policy "Authenticated team can read lead activities"
  on public.lead_activities for select to authenticated
  using (exists (select 1 from public.leads l where l.id = lead_id));

drop policy if exists "Authenticated team can log lead activities" on public.lead_activities;
create policy "Authenticated team can log lead activities"
  on public.lead_activities for insert to authenticated
  with check (exists (select 1 from public.leads l where l.id = lead_id));

grant select, insert on public.lead_activities to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'lead_activities'
     ) then
    alter publication supabase_realtime add table public.lead_activities;
  end if;
end;
$$;
