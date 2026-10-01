-- Monthly safety KPI snapshots.
-- One summary row can represent a site (site_id set) or the full organization (site_id null).
create table if not exists public.safety_monthly_statistics (
  id uuid primary key default gen_random_uuid(),
  month_start date not null check (extract(day from month_start) = 1),
  site_id uuid references public.sites(id),
  reports_total integer not null default 0 check (reports_total >= 0),
  reports_open integer not null default 0 check (reports_open >= 0),
  near_misses integer not null default 0 check (near_misses >= 0),
  unsafe_conditions integer not null default 0 check (unsafe_conditions >= 0),
  positive_observations integer not null default 0 check (positive_observations >= 0),
  incidents_total integer not null default 0 check (incidents_total >= 0),
  recordable_incidents integer not null default 0 check (recordable_incidents >= 0),
  lost_time_incidents integer not null default 0 check (lost_time_incidents >= 0),
  incidents_open integer not null default 0 check (incidents_open >= 0),
  actions_created integer not null default 0 check (actions_created >= 0),
  actions_closed integer not null default 0 check (actions_closed >= 0),
  actions_overdue integer not null default 0 check (actions_overdue >= 0),
  actions_open integer not null default 0 check (actions_open >= 0),
  risks_for_review integer not null default 0 check (risks_for_review >= 0),
  active_risks integer not null default 0 check (active_risks >= 0),
  ncr_open integer not null default 0 check (ncr_open >= 0),
  ncr_closed integer not null default 0 check (ncr_closed >= 0),
  workforce_count integer check (workforce_count is null or workforce_count >= 0),
  exposure_hours numeric(14,2) check (exposure_hours is null or exposure_hours >= 0),
  calculation_method text not null default 'snapshot' check (calculation_method in ('snapshot', 'recalculated', 'imported')),
  notes text,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.safety_monthly_category_statistics (
  id uuid primary key default gen_random_uuid(),
  monthly_statistic_id uuid not null references public.safety_monthly_statistics(id) on delete cascade,
  category public.report_category not null,
  report_count integer not null default 0 check (report_count >= 0),
  open_count integer not null default 0 check (open_count >= 0),
  closed_count integer not null default 0 check (closed_count >= 0),
  created_at timestamptz not null default now(),
  unique (monthly_statistic_id, category)
);

-- NULL site_id represents the organization-wide roll-up. The expression keeps it unique.
create unique index if not exists safety_monthly_statistics_month_site_uidx
  on public.safety_monthly_statistics (
    month_start,
    coalesce(site_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index if not exists safety_monthly_statistics_site_month_idx
  on public.safety_monthly_statistics (site_id, month_start desc);
create index if not exists safety_monthly_statistics_month_idx
  on public.safety_monthly_statistics (month_start desc);
create index if not exists safety_monthly_category_statistics_category_idx
  on public.safety_monthly_category_statistics (category, monthly_statistic_id);

comment on table public.safety_monthly_statistics is 'Auditable monthly HSE KPI snapshots by site or organization roll-up.';
comment on table public.safety_monthly_category_statistics is 'Monthly safety report category breakdown linked to an auditable KPI snapshot.';
comment on column public.safety_monthly_statistics.month_start is 'First calendar day of the reporting month in the site or reporting timezone.';
comment on column public.safety_monthly_statistics.exposure_hours is 'Optional exposure-hours denominator used for rate calculations.';

alter table public.safety_monthly_statistics enable row level security;
alter table public.safety_monthly_category_statistics enable row level security;

drop policy if exists staff_safety_monthly_statistics_all on public.safety_monthly_statistics;
drop policy if exists staff_safety_monthly_category_statistics_all on public.safety_monthly_category_statistics;
create policy staff_safety_monthly_statistics_all
  on public.safety_monthly_statistics
  for all to authenticated
  using (private.is_staff())
  with check (private.is_staff());
create policy staff_safety_monthly_category_statistics_all
  on public.safety_monthly_category_statistics
  for all to authenticated
  using (private.is_staff())
  with check (private.is_staff());

grant select, insert, update, delete on public.safety_monthly_statistics to authenticated;
grant select, insert, update, delete on public.safety_monthly_category_statistics to authenticated;
revoke all on public.safety_monthly_statistics from anon;
revoke all on public.safety_monthly_category_statistics from anon;
