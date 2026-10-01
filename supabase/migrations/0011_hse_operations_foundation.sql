-- KSA SAFETY BOARD / Section 04 HSE Operations foundation
create table if not exists public.employee_directory (
  id uuid primary key default gen_random_uuid(),
  employee_id text unique not null,
  full_name text not null,
  job_title text,
  department_id uuid references public.departments(id),
  site_id uuid references public.sites(id),
  section_name text,
  supervisor_id uuid references public.employee_directory(id),
  email text,
  phone text,
  employment_status text not null default 'active' check (employment_status in ('active','on_leave','terminated')),
  medical_fitness text not null default 'fit' check (medical_fitness in ('fit','fit_with_limitations','medical_review_due')),
  employee_type text not null default 'employee' check (employee_type in ('employee','contractor','visitor','intern')),
  ppe_summary jsonb not null default '{}'::jsonb,
  completed_training jsonb not null default '[]'::jsonb,
  linked_profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.hse_monthly_plans (
  id uuid primary key default gen_random_uuid(),
  plan_year smallint not null check (plan_year between 2020 and 2200),
  plan_month smallint not null check (plan_month between 1 and 12),
  title text not null,
  status text not null default 'draft' check (status in ('draft','active','completed','cancelled')),
  created_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_year, plan_month)
);
create table if not exists public.hse_monthly_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.hse_monthly_plans(id) on delete cascade,
  title text not null,
  title_ar text,
  description text,
  category text not null default 'general' check (category in ('inspections','ptw_loto','fire_safety','training','equipment','electrical','contractor','emergency','environment','documentation','general')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','blocked','escalated','cancelled')),
  assignee_id uuid references public.employee_directory(id),
  backup_id uuid references public.employee_directory(id),
  site_id uuid references public.sites(id),
  department_id uuid references public.departments(id),
  starts_on date,
  due_date date,
  linked_module text,
  linked_record_id uuid,
  notes text,
  recurrence text,
  evidence_required boolean not null default false,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.hse_operation_records (
  id uuid primary key default gen_random_uuid(),
  reference_no text unique not null,
  resource_type text not null check (resource_type in ('violation_template','employee_violation','safety_case','workflow','management_of_change','shift_handover','shift_handover_item','monthly_report','safety_learning','chemical','chemical_transaction','risk_register','risk_control','critical_control','critical_control_verification','process_safety_scenario','process_safety_barrier','barrier_impairment','ih_agent','ih_seg','ih_campaign','ih_measurement','occupational_health_requirement','inspection_template','inspection_schedule','inspection_task','equipment_asset','equipment_defect','fire_event','emergency_event','safety_pyramid')),
  title text not null,
  status text not null default 'draft',
  priority text not null default 'medium',
  owner_id uuid references public.employee_directory(id),
  site_id uuid references public.sites(id),
  department_id uuid references public.departments(id),
  due_date date,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.hse_operation_events (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references public.hse_operation_records(id) on delete cascade,
  event_type text not null,
  actor_id uuid references public.profiles(id),
  previous_data jsonb,
  new_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists employee_directory_status_idx on public.employee_directory(employment_status, medical_fitness, employee_type);
create index if not exists monthly_plan_tasks_due_idx on public.hse_monthly_plan_tasks(status, due_date, priority);
create index if not exists hse_operation_records_resource_idx on public.hse_operation_records(resource_type, status, priority, created_at desc);
create index if not exists hse_operation_records_due_idx on public.hse_operation_records(due_date, status);
create index if not exists hse_operation_events_record_idx on public.hse_operation_events(record_id, created_at desc);
alter table public.employee_directory enable row level security;
alter table public.hse_monthly_plans enable row level security;
alter table public.hse_monthly_plan_tasks enable row level security;
alter table public.hse_operation_records enable row level security;
alter table public.hse_operation_events enable row level security;
drop policy if exists staff_employee_directory on public.employee_directory;
drop policy if exists staff_monthly_plans on public.hse_monthly_plans;
drop policy if exists staff_monthly_plan_tasks on public.hse_monthly_plan_tasks;
drop policy if exists staff_operation_records on public.hse_operation_records;
drop policy if exists staff_operation_events on public.hse_operation_events;
create policy staff_employee_directory on public.employee_directory for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_monthly_plans on public.hse_monthly_plans for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_monthly_plan_tasks on public.hse_monthly_plan_tasks for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_operation_records on public.hse_operation_records for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_operation_events on public.hse_operation_events for select to authenticated using (private.is_staff());
insert into public.permissions(code, description) values
 ('hse.operations.read','View HSE Operations'),
 ('hse.operations.manage','Manage HSE Operations'),
 ('hse.operations.verify','Verify HSE Operations'),
 ('hse.import.manage','Manage controlled HSE imports')
on conflict (code) do nothing;
