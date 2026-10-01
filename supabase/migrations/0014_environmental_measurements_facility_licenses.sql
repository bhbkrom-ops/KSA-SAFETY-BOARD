-- KSA SAFETY BOARD / Section 06B
-- Environmental measurements and facility regulatory licenses.

insert into public.permissions(code, description) values
  ('environment.measurements.read', 'Read environmental measurements'),
  ('environment.measurements.manage', 'Manage environmental measurements'),
  ('facility.licenses.read', 'Read facility regulatory licenses'),
  ('facility.licenses.manage', 'Manage facility regulatory licenses')
on conflict (code) do nothing;

create table if not exists public.environmental_measurements (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique,
  factory text,
  site_id uuid references public.sites(id),
  area text,
  contractor_name text,
  measurement_type text not null check (measurement_type in ('air_quality','noise','workplace_exposure','emissions','water','waste_soil','other')),
  parameter_name text not null,
  measured_value numeric,
  unit text,
  limit_reference numeric,
  limit_reference_unit text,
  limit_reference_source text,
  compliance_status text not null default 'PENDING' check (compliance_status in ('PENDING','COMPLIANT','NON_COMPLIANT')),
  measured_at timestamptz,
  due_at timestamptz,
  reminder_enabled boolean not null default true,
  reminder_days_before integer not null default 30 check (reminder_days_before between 0 and 365),
  reminder_last_processed_at timestamptz,
  notes text,
  evidence_url text,
  owner_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facility_regulatory_licenses (
  id uuid primary key default gen_random_uuid(),
  license_number text not null unique,
  category text not null check (category in ('environmental','civil_defense','municipal','industrial','other_regulatory')),
  facility_name text not null,
  facility_code text,
  site_id uuid references public.sites(id),
  site_name text,
  site_address text,
  issuing_authority text not null,
  issue_date date,
  expiry_date date,
  state text not null default 'ACTIVE' check (state in ('ACTIVE','EXPIRING_SOON','EXPIRED','PENDING_RENEWAL')),
  renewal_required boolean not null default true,
  renewal_owner_id uuid references public.profiles(id),
  renewal_notes text,
  remarks text,
  evidence_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists env_measurements_status_due_idx on public.environmental_measurements(compliance_status, due_at);
create index if not exists env_measurements_type_measured_idx on public.environmental_measurements(measurement_type, measured_at desc);
create index if not exists facility_licenses_state_expiry_idx on public.facility_regulatory_licenses(state, expiry_date);
create index if not exists facility_licenses_category_idx on public.facility_regulatory_licenses(category, facility_name);

alter table public.environmental_measurements enable row level security;
alter table public.facility_regulatory_licenses enable row level security;

drop policy if exists env_measurements_staff_all on public.environmental_measurements;
create policy env_measurements_staff_all on public.environmental_measurements for all to authenticated using (private.is_staff()) with check (private.is_staff());
drop policy if exists facility_licenses_staff_all on public.facility_regulatory_licenses;
create policy facility_licenses_staff_all on public.facility_regulatory_licenses for all to authenticated using (private.is_staff()) with check (private.is_staff());

grant select, insert, update, delete on public.environmental_measurements, public.facility_regulatory_licenses to authenticated;
revoke all on public.environmental_measurements, public.facility_regulatory_licenses from anon;

create or replace function public.process_environmental_measurement_reminders(p_as_of timestamptz default now())
returns integer
language plpgsql
security invoker
set search_path = public, private
as $$
declare processed integer := 0;
begin
  if not private.is_staff() then raise exception 'HSE staff access is required'; end if;
  with due_rows as (
    update public.environmental_measurements m
    set reminder_last_processed_at = p_as_of, updated_at = p_as_of
    where m.reminder_enabled = true
      and m.due_at is not null
      and m.due_at <= p_as_of + make_interval(days => m.reminder_days_before)
      and (m.reminder_last_processed_at is null or m.reminder_last_processed_at < p_as_of - interval '1 day')
      and m.compliance_status <> 'COMPLIANT'
    returning m.id, m.reference_no, m.parameter_name, m.due_at, m.owner_id
  )
  insert into public.notification_outbox(event_type, source_type, source_id, recipient_user_id, channel, subject, body, status, idempotency_key)
  select 'environmental_measurement_due', 'environmental_measurement', id, owner_id, 'in_app',
    'Environmental measurement due',
    reference_no || ' / ' || parameter_name || ' requires measurement follow-up before ' || coalesce(due_at::text, 'the scheduled date'),
    'pending', 'environmental-measurement:' || id::text || ':' || p_as_of::date::text
  from due_rows where owner_id is not null
  on conflict (idempotency_key) do nothing;
  get diagnostics processed = row_count;
  return processed;
end;
$$;
revoke all on function public.process_environmental_measurement_reminders(timestamptz) from public;
grant execute on function public.process_environmental_measurement_reminders(timestamptz) to authenticated;

