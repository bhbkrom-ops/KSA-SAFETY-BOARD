-- KSA SAFETY BOARD / Section 06 HSE Compliance & Work Control
create table if not exists public.ptw_permits (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique,
  permit_type text not null check (permit_type in ('hot_work','work_at_height','confined_space','electrical','excavation','lifting','general')),
  title text not null,
  description text,
  department_id uuid references public.departments(id),
  site_id uuid references public.sites(id),
  work_area text,
  location text not null,
  requester_id uuid references public.profiles(id),
  risk_level text not null default 'medium' check (risk_level in ('low','medium','high','critical')),
  hazards jsonb not null default '[]'::jsonb,
  controls jsonb not null default '[]'::jsonb,
  ppe jsonb not null default '[]'::jsonb,
  linked_loto_id uuid,
  start_at timestamptz,
  expiry_at timestamptz,
  status text not null default 'draft' check (status in ('draft','pending_review','pending_approval','approved','active','suspended','expired','rejected','closed','cancelled')),
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  approved_by uuid references public.profiles(id), approved_at timestamptz,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.loto_records (
  id uuid primary key default gen_random_uuid(), reference_no text not null unique, equipment_asset text not null, energy_type text not null, location text not null, department_id uuid references public.departments(id), site_id uuid references public.sites(id), isolation_type text not null, verification_method text not null, tag_number text, lock_owner_id uuid references public.profiles(id), authorized_employee_id uuid references public.profiles(id), linked_ptw_id uuid references public.ptw_permits(id), start_at timestamptz, end_at timestamptz, status text not null default 'planned' check (status in ('planned','active','isolated','verified','applied','released','closed','cancelled')), created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.loto_isolation_points (
  id uuid primary key default gen_random_uuid(), loto_id uuid not null references public.loto_records(id) on delete cascade, point_label text not null, normal_state text not null, isolated_state text not null, verified boolean not null default false, verified_by uuid references public.profiles(id), verified_at timestamptz, notes text
);
create table if not exists public.loto_locks (
  id uuid primary key default gen_random_uuid(), loto_id uuid not null references public.loto_records(id) on delete cascade, tag_number text not null, owner_id uuid references public.profiles(id), applied_at timestamptz, removed_at timestamptz, status text not null default 'applied' check (status in ('applied','removed'))
);
create table if not exists public.job_safety_analyses (
  id uuid primary key default gen_random_uuid(), reference_no text not null unique, title text not null, permit_id uuid references public.ptw_permits(id) on delete cascade, status text not null default 'draft' check (status in ('draft','acknowledged','approved','expired')), created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.lmra_assessments (
  id uuid primary key default gen_random_uuid(), reference_no text not null unique, permit_id uuid references public.ptw_permits(id) on delete cascade, assessed_by uuid references public.profiles(id), hazards jsonb not null default '[]'::jsonb, controls_confirmed boolean not null default false, status text not null default 'draft' check (status in ('draft','accepted','rejected')), assessed_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.inspection_templates (
  id uuid primary key default gen_random_uuid(), reference_no text not null unique, title text not null, category text not null, frequency text not null, checklist jsonb not null default '[]'::jsonb, is_active boolean not null default true, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.inspection_tasks (
  id uuid primary key default gen_random_uuid(), reference_no text not null unique, template_id uuid references public.inspection_templates(id), title text not null, assigned_to uuid references public.profiles(id), due_at timestamptz, status text not null default 'planned' check (status in ('planned','in_progress','completed','overdue','fail','pass','closed','cancelled')), result jsonb not null default '{}'::jsonb, created_by uuid references public.profiles(id), completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.inspection_observations (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.inspection_tasks(id) on delete cascade, title text not null, severity text not null check (severity in ('low','medium','high','critical')), immediate_action text, capa_action_id uuid references public.actions(id), status text not null default 'open' check (status in ('open','closed')), created_by uuid references public.profiles(id), created_at timestamptz not null default now(), closed_at timestamptz
);
create table if not exists public.hse_audits (
  id uuid primary key default gen_random_uuid(), reference_no text not null unique, title text not null, standard text not null check (standard in ('ISO 45001','ISO 14001','internal','legal')), audit_type text not null, status text not null default 'planned' check (status in ('planned','in_progress','completed','cancelled')), plan_date date, lead_auditor_id uuid references public.profiles(id), created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.hse_audit_findings (
  id uuid primary key default gen_random_uuid(), audit_id uuid not null references public.hse_audits(id) on delete cascade, finding_type text not null check (finding_type in ('major_nc','minor_nc','observation','opportunity')), title text not null, evidence text, due_date date, capa_action_id uuid references public.actions(id), status text not null default 'open' check (status in ('open','in_progress','closed','overdue')), created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table if not exists public.compliance_obligations (
  id uuid primary key default gen_random_uuid(), reference_no text not null unique, title text not null, requirement text not null, authority text, framework text, clause text, obligation_type text, jurisdiction text, source_url text, department_id uuid references public.departments(id), site_id uuid references public.sites(id), owner_id uuid references public.profiles(id), applicability text not null default 'applicable' check (applicability in ('applicable','not_applicable','under_review')), status text not null default 'partially_compliant' check (status in ('compliant','partially_compliant','non_compliant','under_review')), criticality text not null default 'medium' check (criticality in ('low','medium','high','critical')), effective_date date, expiry_date date, renewal_required boolean not null default false, renewal_lead_days integer, next_review_date date, evidence_summary text, evidence_url text, gap_description text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.work_control_history (
  id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id uuid not null, action text not null, previous_status text, new_status text, actor_id uuid references public.profiles(id), details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index if not exists ptw_status_expiry_idx on public.ptw_permits(status, expiry_at, risk_level);
create index if not exists loto_status_idx on public.loto_records(status, end_at);
create index if not exists inspection_task_due_idx on public.inspection_tasks(status, due_at);
create index if not exists audit_finding_due_idx on public.hse_audit_findings(status, due_date);
create index if not exists compliance_review_idx on public.compliance_obligations(status, expiry_date, next_review_date);
create index if not exists work_control_history_lookup_idx on public.work_control_history(entity_type, entity_id, created_at desc);

alter table public.ptw_permits enable row level security;
alter table public.loto_records enable row level security;
alter table public.loto_isolation_points enable row level security;
alter table public.loto_locks enable row level security;
alter table public.job_safety_analyses enable row level security;
alter table public.lmra_assessments enable row level security;
alter table public.inspection_templates enable row level security;
alter table public.inspection_tasks enable row level security;
alter table public.inspection_observations enable row level security;
alter table public.hse_audits enable row level security;
alter table public.hse_audit_findings enable row level security;
alter table public.compliance_obligations enable row level security;
alter table public.work_control_history enable row level security;

do $$ declare t text; begin foreach t in array array['ptw_permits','loto_records','loto_isolation_points','loto_locks','job_safety_analyses','lmra_assessments','inspection_templates','inspection_tasks','inspection_observations','hse_audits','hse_audit_findings','compliance_obligations','work_control_history'] loop execute format('drop policy if exists staff_%s_all on public.%I', t, t); execute format('create policy staff_%s_all on public.%I for all to authenticated using (private.is_staff()) with check (private.is_staff())', t, t); end loop; end $$;
insert into public.permissions(code, description) values ('work_control.read','View permits, LOTO, inspections, audits and compliance'),('work_control.manage','Create and update work-control records'),('ptw.issue','Issue and approve permits'),('loto.manage','Manage LOTO isolations and locks'),('inspection.manage','Manage inspection templates and tasks'),('compliance.manage','Manage compliance obligations') on conflict (code) do nothing;
