-- Alineación 1:1 con el flujo de Google Sheets de Campuslands
-- Soporte para 7 estados de cierre, prioridades, acuerdos y estados de gestión de pago

alter table public.leads drop constraint if exists leads_stage_check;
alter table public.leads add constraint leads_stage_check check (stage in ('nuevo', 'en_conversacion', 'interesado', 'ya_se_llamo', 'confirmado', 'inscrito_forms', 'no_interesado', 'contactado', 'visita', 'inscrito', 'perdido'));

alter table public.lead_events drop constraint if exists lead_events_from_stage_check;
alter table public.lead_events drop constraint if exists lead_events_to_stage_check;

alter table public.leads add column if not exists priority text not null default 'SEGUIMIENTO';
alter table public.leads add column if not exists agreement text not null default '';
alter table public.leads add column if not exists payment_status text not null default '';

create index if not exists leads_priority_idx on public.leads (priority);
create index if not exists leads_agreement_idx on public.leads (agreement);
create index if not exists leads_payment_status_idx on public.leads (payment_status);
