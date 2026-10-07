create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null default '',
  origin text not null default 'Sin origen',
  product text not null default '',
  stage text not null default 'nuevo' check (stage in ('nuevo','interesado','contactado','visita','inscrito','perdido')),
  interest text not null default 'sin_clasificar' check (interest in ('alto','medio','bajo','sin_clasificar')),
  deal_amount numeric(12,2) not null default 0 check (deal_amount >= 0),
  payment_method text not null default '' check (payment_method in ('','Transferencia','Tarjeta','Efectivo','Financiamiento','Otro')),
  next_contact_at date,
  notes text not null default '',
  source_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('Transferencia','Tarjeta','Efectivo','Financiamiento','Otro')),
  status text not null default 'pendiente' check (status in ('pendiente','pagado','anulado')),
  due_date date,
  paid_at timestamptz,
  reference text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_stage text check (from_stage is null or from_stage in ('nuevo','interesado','contactado','visita','inscrito','perdido')),
  to_stage text not null check (to_stage in ('nuevo','interesado','contactado','visita','inscrito','perdido')),
  changed_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_origin_idx on public.leads (origin);
create index if not exists leads_phone_idx on public.leads (phone);
create index if not exists leads_next_contact_idx on public.leads (next_contact_at) where next_contact_at is not null;
create index if not exists payments_lead_id_idx on public.payments (lead_id);
create index if not exists payments_status_paid_at_idx on public.payments (status, paid_at desc);
create index if not exists lead_events_lead_changed_idx on public.lead_events (lead_id, changed_at desc);

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads for each row execute procedure public.set_updated_at();

alter table public.leads enable row level security;
alter table public.payments enable row level security;
alter table public.lead_events enable row level security;

drop policy if exists "Authenticated team can manage leads" on public.leads;
create policy "Authenticated team can manage leads" on public.leads for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated team can manage payments" on public.payments;
create policy "Authenticated team can manage payments" on public.payments for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated team can manage lead events" on public.lead_events;
create policy "Authenticated team can manage lead events" on public.lead_events for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.lead_events to authenticated;
