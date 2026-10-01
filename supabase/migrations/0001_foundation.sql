-- KSA SAFETY BOARD / shared foundation
create extension if not exists pgcrypto;

create type public.user_role_code as enum ('super_admin','hse_manager','hse_leader','hse_supervisor','senior_safety_officer','safety_officer','department_manager','supervisor','employee','contractor','auditor','viewer');
create type public.report_status as enum ('submitted','triaged','assigned','in_progress','pending_verification','closed','reopened');
create type public.report_category as enum ('unsafe_act','unsafe_condition','hazard','near_miss','safety_observation','positive_observation','fire_observation','environmental_observation');
create type public.action_status as enum ('open','assigned','in_progress','pending_verification','closed','reopened');
create type public.priority_level as enum ('low','medium','high','critical');
create type public.incident_status as enum ('reported','under_investigation','pending_approval','closed','reopened');
create type public.ncr_status as enum ('open','assigned','in_progress','pending_verification','closed','reopened');
create type public.risk_status as enum ('draft','review','approved','active','superseded','archived');

create table public.roles (
  id uuid primary key default gen_random_uuid(), code public.user_role_code unique not null, name text not null, description text, created_at timestamptz not null default now()
);
create table public.permissions (
  id uuid primary key default gen_random_uuid(), code text unique not null, description text, created_at timestamptz not null default now()
);
create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade, permission_id uuid not null references public.permissions(id) on delete cascade, primary key (role_id, permission_id)
);
create table public.departments (
  id uuid primary key default gen_random_uuid(), name text not null, code text unique, created_at timestamptz not null default now(), archived_at timestamptz
);
create table public.sites (
  id uuid primary key default gen_random_uuid(), name text not null, code text unique, timezone text not null default 'UTC', created_at timestamptz not null default now(), archived_at timestamptz
);
create table public.buildings (
  id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites(id), name text not null, created_at timestamptz not null default now(), unique(site_id, name)
);
create table public.work_areas (
  id uuid primary key default gen_random_uuid(), building_id uuid references public.buildings(id), name text not null, created_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, display_name text, email text, role_code public.user_role_code not null default 'employee', department_id uuid references public.departments(id), site_id uuid references public.sites(id), is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade, role_id uuid not null references public.roles(id) on delete cascade, assigned_by uuid references public.profiles(id), assigned_at timestamptz not null default now(), primary key(user_id, role_id)
);
create table public.system_settings (
  key text primary key, value jsonb not null default '{}'::jsonb, updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);
create table public.attachments (
  id uuid primary key default gen_random_uuid(), storage_path text not null unique, original_name text not null, mime_type text not null, byte_size bigint not null check(byte_size > 0 and byte_size <= 10485760), uploaded_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(), reference_no text unique not null, category public.report_category not null, status public.report_status not null default 'submitted', priority public.priority_level not null default 'medium', occurred_at timestamptz not null default now(), reporter_id uuid references public.profiles(id), reporter_name text, department_id uuid references public.departments(id), site_id uuid references public.sites(id), work_area_id uuid references public.work_areas(id), exact_area text, description text not null check(char_length(description) >= 10), immediate_action text, recommended_action text, responsible_id uuid references public.profiles(id), due_date date, is_public_submission boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), closed_at timestamptz
);
create table public.report_attachments (
  report_id uuid not null references public.reports(id) on delete cascade, attachment_id uuid not null references public.attachments(id) on delete cascade, primary key(report_id, attachment_id)
);
create table public.actions (
  id uuid primary key default gen_random_uuid(), reference_no text unique not null, source_type text not null check(source_type in ('report','ncr','incident','risk','inspection','audit','drill','ptw')), source_id uuid not null, title text not null, description text, status public.action_status not null default 'open', priority public.priority_level not null default 'medium', owner_id uuid references public.profiles(id), due_date date, verified_by uuid references public.profiles(id), verified_at timestamptz, closed_at timestamptz, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.incidents (
  id uuid primary key default gen_random_uuid(), reference_no text unique not null, title text not null, incident_type text not null, status public.incident_status not null default 'reported', severity public.priority_level not null default 'medium', occurred_at timestamptz not null, site_id uuid references public.sites(id), work_area_id uuid references public.work_areas(id), description text not null, direct_cause text, underlying_cause text, root_cause text, contributing_factors text, lessons_learned text, investigator_id uuid references public.profiles(id), approved_by uuid references public.profiles(id), created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.ncr (
  id uuid primary key default gen_random_uuid(), reference_no text unique not null, status public.ncr_status not null default 'open', source text not null, requirement text, nonconformance text not null, severity public.priority_level not null default 'medium', department_id uuid references public.departments(id), site_id uuid references public.sites(id), immediate_correction text, root_cause text, owner_id uuid references public.profiles(id), due_date date, verification text, effectiveness text, approved_by uuid references public.profiles(id), closed_at timestamptz, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.capa (
  id uuid primary key default gen_random_uuid(), ncr_id uuid not null references public.ncr(id) on delete cascade, action_id uuid references public.actions(id), preventive_action text, effectiveness_review text, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, created_at timestamptz not null default now()
);
create table public.risk_assessments (
  id uuid primary key default gen_random_uuid(), reference_no text unique not null, title text not null, status public.risk_status not null default 'draft', activity text not null, site_id uuid references public.sites(id), work_area_id uuid references public.work_areas(id), owner_id uuid references public.profiles(id), approved_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.risk_hazards (
  id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.risk_assessments(id) on delete cascade, hazard text not null, persons_at_risk text, consequence text, existing_controls text, likelihood smallint not null check(likelihood between 1 and 5), severity smallint not null check(severity between 1 and 5), additional_controls text, residual_likelihood smallint check(residual_likelihood between 1 and 5), residual_severity smallint check(residual_severity between 1 and 5), responsible_id uuid references public.profiles(id), due_date date, created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), event_type text not null, entity_type text not null, entity_id uuid, previous_data jsonb, new_data jsonb, request_id text, created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade, title text not null, body text, severity public.priority_level not null default 'medium', is_read boolean not null default false, entity_type text, entity_id uuid, created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports(status, priority, due_date);
create index reports_site_idx on public.reports(site_id, created_at desc);
create index actions_owner_idx on public.actions(owner_id, status, due_date);
create index incidents_status_idx on public.incidents(status, severity, occurred_at desc);
create index ncr_status_idx on public.ncr(status, severity, due_date);
create index risk_status_idx on public.risk_assessments(status, site_id);
create index audit_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email) on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role_code in ('super_admin','hse_manager','hse_leader','hse_supervisor','senior_safety_officer','safety_officer','auditor') from public.profiles where id = auth.uid() and is_active), false);
$$;

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_attachments enable row level security;
alter table public.attachments enable row level security;
alter table public.actions enable row level security;
alter table public.incidents enable row level security;
alter table public.ncr enable row level security;
alter table public.capa enable row level security;
alter table public.risk_assessments enable row level security;
alter table public.risk_hazards enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_self_select on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy public_report_insert on public.reports for insert to anon, authenticated with check (is_public_submission = true and reporter_id is null);
create policy staff_reports_select on public.reports for select to authenticated using (public.is_staff());
create policy staff_reports_write on public.reports for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_actions_all on public.actions for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_incidents_all on public.incidents for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_ncr_all on public.ncr for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_capa_all on public.capa for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_risk_all on public.risk_assessments for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_hazard_all on public.risk_hazards for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy recipient_notifications on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy recipient_notifications_update on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy staff_audit_select on public.audit_logs for select to authenticated using (public.is_staff());

insert into public.roles(code, name) values
 ('super_admin','Super Admin'),('hse_manager','HSE Manager'),('hse_leader','HSE Leader'),('hse_supervisor','HSE Supervisor'),('senior_safety_officer','Senior Safety Officer'),('safety_officer','Safety Officer'),('department_manager','Department Manager'),('supervisor','Supervisor'),('employee','Employee'),('contractor','Contractor'),('auditor','Auditor'),('viewer','Viewer') on conflict (code) do nothing;
insert into public.permissions(code, description) values
 ('dashboard.view','View command center'),('reports.create','Create safety reports'),('reports.edit','Edit safety reports'),('reports.close','Close safety reports'),('ncr.create','Create NCR'),('ncr.assign','Assign NCR'),('ncr.verify','Verify NCR'),('ncr.close','Close NCR'),('incident.investigate','Investigate incidents'),('incident.approve','Approve incidents'),('risk.create','Create risk assessments'),('risk.approve','Approve risk assessments'),('inspection.manage','Manage inspections'),('ptw.issue','Issue permits'),('fire.manage','Manage fire protection'),('training.manage','Manage training'),('meetings.create','Create meetings'),('users.manage','Manage users'),('roles.manage','Manage roles'),('settings.manage','Manage settings') on conflict (code) do nothing;
insert into public.system_settings(key, value) values ('branding', '{"board_name":"KSA SAFETY BOARD","primary_color":"#163c52","secondary_color":"#5babb6"}'), ('backgrounds', '{"rotation_enabled":false,"items":[]}') on conflict (key) do nothing;
