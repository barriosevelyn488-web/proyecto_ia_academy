-- Evolución SaaS-ready: Multi-organización, roles de equipo, motivo de pérdida, NIT y métricas agregadas en PostgreSQL.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.organizations (slug, name)
values ('campuslands-gt', 'Campuslands Guatemala')
on conflict (slug) do nothing;

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'advisor' check (role in ('admin', 'coordinator', 'advisor')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

alter table public.leads
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists loss_reason text not null default '',
  add column if not exists nit text not null default '';

create index if not exists leads_org_stage_idx
  on public.leads (organization_id, stage, created_at desc);
create index if not exists leads_assigned_idx
  on public.leads (assigned_to) where assigned_to is not null;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "Authenticated users can read organizations" on public.organizations;
create policy "Authenticated users can read organizations"
  on public.organizations for select to authenticated using (true);

drop policy if exists "Authenticated users can read members" on public.organization_members;
create policy "Authenticated users can read members"
  on public.organization_members for select to authenticated using (true);

grant select on public.organizations to authenticated;
grant select on public.organization_members to authenticated;

-- Función RPC para calcular métricas agregadas en el servidor (escala a decenas de miles de leads sin saturar RAM del navegador).
create or replace function public.get_crm_summary(p_days integer default 30)
returns jsonb
language sql
stable
security invoker
as $$
  with scoped_leads as (
    select *
    from public.leads
    where p_days is null or p_days <= 0 or created_at >= (now() - make_interval(days => p_days))
  ),
  scoped_payments as (
    select *
    from public.payments
    where status = 'pagado'
      and (p_days is null or p_days <= 0 or coalesce(paid_at, created_at) >= (now() - make_interval(days => p_days)))
  )
  select jsonb_build_object(
    'total_leads', (select count(*) from scoped_leads),
    'enrolled_leads', (select count(*) from scoped_leads where stage = 'inscrito'),
    'lost_leads', (select count(*) from scoped_leads where stage = 'perdido'),
    'pipeline_value', (select coalesce(sum(deal_amount), 0) from public.leads where stage not in ('inscrito', 'perdido')),
    'collected_revenue', (select coalesce(sum(amount), 0) from scoped_payments),
    'pending_payments', (select coalesce(sum(amount), 0) from public.payments where status = 'pendiente'),
    'overdue_followups', (
      select count(*) from public.leads
      where next_contact_at is not null
        and next_contact_at < current_date
        and stage not in ('inscrito', 'perdido')
    )
  );
$$;

grant execute on function public.get_crm_summary(integer) to authenticated;

-- Habilitar Realtime automáticamente para leads y payments si existe la publicación.
do $$
declare
  tbl text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach tbl in array array['leads', 'payments'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = tbl
      ) then
        execute format('alter publication supabase_realtime add table public.%I', tbl);
      end if;
    end loop;
  end if;
end;
$$;
