-- Section 17: SIMOPS governed capability.
-- Introduces the production schema, conflict rules, RLS and activation controls.

create table if not exists public.simops_plans (
  id uuid primary key default gen_random_uuid(),
  plan_no text not null unique,
  title text not null,
  site_id uuid references public.sites(id) on delete set null,
  area text,
  window_start timestamptz not null,
  window_end timestamptz not null,
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','review','approved','active','closed','cancelled')),
  scope text,
  notes text,
  linked_ptw_id uuid references public.ptw_permits(id) on delete set null,
  linked_jsa_id uuid references public.job_safety_analyses(id) on delete set null,
  linked_lmra_id uuid references public.lmra_assessments(id) on delete set null,
  linked_loto_id uuid references public.loto_records(id) on delete set null,
  linked_moc_record_id uuid references public.hse_operation_records(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint simops_plan_window_chk check (window_end > window_start)
);

create table if not exists public.simops_activities (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.simops_plans(id) on delete cascade,
  activity_code text not null,
  title text not null,
  activity_type text not null check (activity_type in (
    'hot_work','flammable_transfer','lifting','pedestrian_access',
    'energized_electrical','intrusive_work','confined_space',
    'chemical_process','other'
  )),
  contractor_id uuid references public.contractors(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  location text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  permit_id uuid references public.ptw_permits(id) on delete set null,
  jsa_id uuid references public.job_safety_analyses(id) on delete set null,
  lmra_id uuid references public.lmra_assessments(id) on delete set null,
  loto_id uuid references public.loto_records(id) on delete set null,
  energy_sources jsonb not null default '[]'::jsonb,
  equipment jsonb not null default '[]'::jsonb,
  critical_controls jsonb not null default '[]'::jsonb,
  status text not null default 'planned' check (status in ('planned','ready','active','completed','cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint simops_activity_window_chk check (end_at > start_at),
  constraint simops_activity_code_uq unique(plan_id,activity_code)
);

create table if not exists public.simops_conflict_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null unique,
  name text not null,
  activity_type_a text not null,
  activity_type_b text not null,
  severity text not null check (severity in ('low','medium','high','critical')),
  rationale text not null,
  required_controls jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  system_seeded boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simops_conflicts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.simops_plans(id) on delete cascade,
  activity_a_id uuid not null references public.simops_activities(id) on delete cascade,
  activity_b_id uuid not null references public.simops_activities(id) on delete cascade,
  rule_id uuid not null references public.simops_conflict_rules(id) on delete restrict,
  severity text not null check (severity in ('low','medium','high','critical')),
  rationale text not null,
  required_controls jsonb not null default '[]'::jsonb,
  owner_id uuid references public.profiles(id) on delete set null,
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  resolution text,
  status text not null default 'open' check (status in ('open','acknowledged','controlled','resolved','accepted')),
  evidence_url text,
  linked_action_id uuid references public.actions(id) on delete set null,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint simops_conflict_distinct_activities_chk check (activity_a_id <> activity_b_id),
  constraint simops_conflict_pair_uq unique(plan_id,activity_a_id,activity_b_id,rule_id)
);

create index if not exists simops_plans_status_window_idx on public.simops_plans(status,window_start,window_end);
create index if not exists simops_activities_plan_time_idx on public.simops_activities(plan_id,start_at,end_at);
create index if not exists simops_activities_type_idx on public.simops_activities(activity_type);
create index if not exists simops_conflicts_plan_status_idx on public.simops_conflicts(plan_id,status,severity);

insert into public.simops_conflict_rules(rule_code,name,activity_type_a,activity_type_b,severity,rationale,required_controls,system_seeded)
values
 ('SIMOPS-HOT-FLAM','Hot work with flammable transfer','hot_work','flammable_transfer','critical',
  'Ignition-producing work must not overlap flammable material transfer in the same work location.',
  '["Suspend one activity","Establish gas testing and exclusion zone","Confirm fire watch and emergency readiness"]'::jsonb,true),
 ('SIMOPS-LIFT-PED','Lifting with pedestrian/public access','lifting','pedestrian_access','high',
  'Suspended loads and lifting envelopes are incompatible with uncontrolled pedestrian access.',
  '["Barricade lifting zone","Provide banksman","Reroute pedestrian access"]'::jsonb,true),
 ('SIMOPS-ELEC-INTR','Energized electrical with nearby intrusive work','energized_electrical','intrusive_work','critical',
  'Intrusive work near energized systems can defeat electrical clearances and isolation boundaries.',
  '["De-energize where practicable","Verify electrical boundaries","Coordinate PTW/LOTO and authorized persons"]'::jsonb,true),
 ('SIMOPS-CS-CHEM','Confined space with adjacent chemical/process operation','confined_space','chemical_process','critical',
  'Adjacent process or chemical operations can change the confined-space atmosphere or introduce hazardous energy.',
  '["Isolate adjacent process","Continuous atmosphere monitoring","Confirm rescue readiness and communication"]'::jsonb,true)
on conflict(rule_code) do update set
 name=excluded.name,
 activity_type_a=excluded.activity_type_a,
 activity_type_b=excluded.activity_type_b,
 severity=excluded.severity,
 rationale=excluded.rationale,
 required_controls=excluded.required_controls,
 system_seeded=true,
 updated_at=now();

create or replace function private.enforce_simops_activity_window()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare p_start timestamptz; p_end timestamptz;
begin
  select window_start,window_end into p_start,p_end from public.simops_plans where id=new.plan_id;
  if p_start is null then raise exception 'SIMOPS plan not found' using errcode='23503'; end if;
  if new.start_at < p_start or new.end_at > p_end then
    raise exception 'SIMOPS activity must remain inside the plan time window' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_simops_activity_window() from public,anon,authenticated;

drop trigger if exists simops_activity_window_guard on public.simops_activities;
create trigger simops_activity_window_guard
before insert or update of plan_id,start_at,end_at on public.simops_activities
for each row execute function private.enforce_simops_activity_window();

create or replace function private.enforce_simops_plan_activation()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.status='active' and old.status is distinct from 'active' then
    if exists (
      select 1 from public.simops_conflicts c
      where c.plan_id=new.id
        and c.severity in ('high','critical')
        and c.status not in ('controlled','resolved','accepted')
    ) then
      raise exception 'SIMOPS plan cannot become active with unresolved high/critical conflicts' using errcode='23514';
    end if;
  end if;
  new.updated_at=now();
  return new;
end;
$$;
revoke all on function private.enforce_simops_plan_activation() from public,anon,authenticated;

drop trigger if exists simops_plan_activation_guard on public.simops_plans;
create trigger simops_plan_activation_guard
before update on public.simops_plans
for each row execute function private.enforce_simops_plan_activation();

alter table public.simops_plans enable row level security;
alter table public.simops_activities enable row level security;
alter table public.simops_conflict_rules enable row level security;
alter table public.simops_conflicts enable row level security;

revoke all on public.simops_plans,public.simops_activities,public.simops_conflict_rules,public.simops_conflicts from anon;
grant select,insert,update,delete on public.simops_plans,public.simops_activities,public.simops_conflicts to authenticated;
grant select on public.simops_conflict_rules to authenticated;
grant insert,update,delete on public.simops_conflict_rules to authenticated;

drop policy if exists simops_plans_staff_select on public.simops_plans;
drop policy if exists simops_plans_staff_insert on public.simops_plans;
drop policy if exists simops_plans_staff_update on public.simops_plans;
drop policy if exists simops_plans_admin_delete on public.simops_plans;
create policy simops_plans_staff_select on public.simops_plans for select to authenticated using (private.is_staff());
create policy simops_plans_staff_insert on public.simops_plans for insert to authenticated with check (private.is_staff() and (created_by is null or created_by=(select auth.uid())));
create policy simops_plans_staff_update on public.simops_plans for update to authenticated using (private.is_staff()) with check (private.is_staff());
create policy simops_plans_admin_delete on public.simops_plans for delete to authenticated using (private.is_admin_manager());

drop policy if exists simops_activities_staff_select on public.simops_activities;
drop policy if exists simops_activities_staff_insert on public.simops_activities;
drop policy if exists simops_activities_staff_update on public.simops_activities;
drop policy if exists simops_activities_admin_delete on public.simops_activities;
create policy simops_activities_staff_select on public.simops_activities for select to authenticated using (private.is_staff());
create policy simops_activities_staff_insert on public.simops_activities for insert to authenticated with check (private.is_staff() and (created_by is null or created_by=(select auth.uid())));
create policy simops_activities_staff_update on public.simops_activities for update to authenticated using (private.is_staff()) with check (private.is_staff());
create policy simops_activities_admin_delete on public.simops_activities for delete to authenticated using (private.is_admin_manager());

drop policy if exists simops_rules_staff_select on public.simops_conflict_rules;
drop policy if exists simops_rules_admin_write on public.simops_conflict_rules;
drop policy if exists simops_rules_admin_update on public.simops_conflict_rules;
drop policy if exists simops_rules_admin_delete on public.simops_conflict_rules;
create policy simops_rules_staff_select on public.simops_conflict_rules for select to authenticated using (private.is_staff());
create policy simops_rules_admin_write on public.simops_conflict_rules for insert to authenticated with check (private.is_admin_manager());
create policy simops_rules_admin_update on public.simops_conflict_rules for update to authenticated using (private.is_admin_manager()) with check (private.is_admin_manager());
create policy simops_rules_admin_delete on public.simops_conflict_rules for delete to authenticated using (private.is_admin_manager() and system_seeded=false);

drop policy if exists simops_conflicts_staff_select on public.simops_conflicts;
drop policy if exists simops_conflicts_staff_insert on public.simops_conflicts;
drop policy if exists simops_conflicts_staff_update on public.simops_conflicts;
drop policy if exists simops_conflicts_admin_delete on public.simops_conflicts;
create policy simops_conflicts_staff_select on public.simops_conflicts for select to authenticated using (private.is_staff());
create policy simops_conflicts_staff_insert on public.simops_conflicts for insert to authenticated with check (private.is_staff());
create policy simops_conflicts_staff_update on public.simops_conflicts for update to authenticated using (private.is_staff()) with check (private.is_staff());
create policy simops_conflicts_admin_delete on public.simops_conflicts for delete to authenticated using (private.is_admin_manager());
