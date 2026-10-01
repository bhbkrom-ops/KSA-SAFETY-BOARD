-- KSA SAFETY BOARD / Overview operational resources
insert into public.permissions (code, description) values
  ('overview.read', 'View Overview command center and intelligence'),
  ('overview.manage', 'Manage management reviews, HSE objectives, and environmental aspects'),
  ('overview.snapshot', 'Capture governed management review snapshots')
on conflict (code) do nothing;

create table public.hse_management_reviews (
  id uuid primary key default gen_random_uuid(),
  reference_no text unique not null,
  title text not null check (char_length(trim(title)) between 2 and 200),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','closed','cancelled')),
  chair_id uuid references public.profiles(id),
  captured_snapshot jsonb,
  captured_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create table public.hse_management_review_items (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.hse_management_reviews(id) on delete cascade,
  topic text not null check (topic in ('incidents_near_misses','objectives_kpis','compliance_audits','capa_effectiveness','risk_critical_controls','training_competence','contractor_safety','emergency_fire','industrial_hygiene','management_of_change','resources_opportunities')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  decision text,
  action_required boolean not null default false,
  owner_id uuid references public.profiles(id),
  due_date date,
  evidence_url text,
  resource_needs text,
  opportunities text,
  status text not null default 'open' check (status in ('open','in_progress','completed','deferred')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hse_objectives (
  id uuid primary key default gen_random_uuid(),
  reference_no text unique not null,
  description text not null check (char_length(trim(description)) between 3 and 500),
  category text not null,
  department_id uuid references public.departments(id),
  site_id uuid references public.sites(id),
  owner_id uuid references public.profiles(id),
  target_value numeric,
  current_value numeric,
  unit text,
  direction text not null default 'increase' check (direction in ('increase','decrease','maintain')), 
  review_frequency text not null default 'monthly',
  management_review_id uuid references public.hse_management_reviews(id) on delete set null,
  notes text,
  comment text,
  evidence_url text,
  status text not null default 'draft' check (status in ('draft','active','at_risk','achieved','closed','cancelled')),
  next_review_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hse_objective_updates (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.hse_objectives(id) on delete cascade,
  current_value numeric,
  comment text not null,
  evidence_url text,
  recorded_by uuid references public.profiles(id),
  recorded_at timestamptz not null default now()
);

create table public.hse_objective_actions (
  objective_id uuid not null references public.hse_objectives(id) on delete cascade,
  action_id uuid not null references public.actions(id) on delete cascade,
  primary key (objective_id, action_id)
);

create table public.environmental_aspects (
  id uuid primary key default gen_random_uuid(),
  reference_no text unique not null,
  activity text not null,
  aspect text not null,
  impact text not null,
  category text not null,
  environmental_medium text not null,
  operating_condition text not null default 'normal',
  site_id uuid references public.sites(id),
  area text,
  inherent_severity smallint check (inherent_severity between 1 and 5),
  inherent_likelihood smallint check (inherent_likelihood between 1 and 5),
  inherent_frequency smallint check (inherent_frequency between 1 and 5),
  residual_likelihood smallint check (residual_likelihood between 1 and 5),
  residual_frequency smallint check (residual_frequency between 1 and 5),
  significance_threshold numeric,
  operational_controls text,
  owner_id uuid references public.profiles(id),
  review_date date,
  evidence_url text,
  obligation_reference text,
  status text not null default 'active' check (status in ('draft','active','significant','under_review','closed')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.environmental_monitoring_records (
  id uuid primary key default gen_random_uuid(),
  aspect_id uuid not null references public.environmental_aspects(id) on delete cascade,
  environmental_medium text not null,
  monitoring_unit text not null,
  reference_limit numeric,
  reference_limit_source text,
  measured_value numeric,
  measured_at timestamptz not null,
  location text,
  findings text,
  status text not null default 'within_limit' check (status in ('within_limit','exceedance','invalid_unit','pending_review')),
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index hse_reviews_status_period_idx on public.hse_management_reviews(status, period_end desc);
create index hse_review_items_review_status_idx on public.hse_management_review_items(review_id, status, due_date);
create index hse_objectives_status_review_idx on public.hse_objectives(status, next_review_date);
create index hse_objectives_site_category_idx on public.hse_objectives(site_id, category);
create index hse_objective_updates_obj_time_idx on public.hse_objective_updates(objective_id, recorded_at desc);
create index environmental_aspects_status_review_idx on public.environmental_aspects(status, review_date);
create index environmental_aspects_site_medium_idx on public.environmental_aspects(site_id, environmental_medium);
create index environmental_monitoring_aspect_time_idx on public.environmental_monitoring_records(aspect_id, measured_at desc);
create index environmental_monitoring_status_idx on public.environmental_monitoring_records(status, measured_at desc);

alter table public.hse_management_reviews enable row level security;
alter table public.hse_management_review_items enable row level security;
alter table public.hse_objectives enable row level security;
alter table public.hse_objective_updates enable row level security;
alter table public.hse_objective_actions enable row level security;
alter table public.environmental_aspects enable row level security;
alter table public.environmental_monitoring_records enable row level security;

create policy overview_reviews_staff_all on public.hse_management_reviews for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy overview_review_items_staff_all on public.hse_management_review_items for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy overview_objectives_staff_all on public.hse_objectives for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy overview_objective_updates_staff_all on public.hse_objective_updates for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy overview_objective_actions_staff_all on public.hse_objective_actions for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy overview_aspects_staff_all on public.environmental_aspects for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy overview_monitoring_staff_all on public.environmental_monitoring_records for all to authenticated using (private.is_staff()) with check (private.is_staff());

grant select, insert, update, delete on public.hse_management_reviews, public.hse_management_review_items, public.hse_objectives, public.hse_objective_updates, public.hse_objective_actions, public.environmental_aspects, public.environmental_monitoring_records to authenticated;
revoke all on public.hse_management_reviews, public.hse_management_review_items, public.hse_objectives, public.hse_objective_updates, public.hse_objective_actions, public.environmental_aspects, public.environmental_monitoring_records from anon;

create or replace function private.overview_audit_trigger() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs(actor_id, event_type, entity_type, entity_id, previous_data, new_data)
  values ((select auth.uid()), TG_OP, TG_TABLE_NAME, coalesce(new.id, old.id), case when TG_OP = 'INSERT' then null else to_jsonb(old) end, case when TG_OP = 'DELETE' then null else to_jsonb(new) end);
  return coalesce(new, old);
end;
$$;
create trigger hse_reviews_audit after insert or update or delete on public.hse_management_reviews for each row execute procedure private.overview_audit_trigger();
create trigger hse_objectives_audit after insert or update or delete on public.hse_objectives for each row execute procedure private.overview_audit_trigger();
create trigger environmental_aspects_audit after insert or update or delete on public.environmental_aspects for each row execute procedure private.overview_audit_trigger();
