-- KSA SAFETY BOARD / Section 05 HSE Escalation Management
create table if not exists public.escalation_rules (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique,
  source_type text not null,
  severity text not null check (severity in ('low','medium','high','critical')),
  timeline_minutes integer not null check (timeline_minutes > 0),
  escalation_level integer not null default 1 check (escalation_level between 1 and 10),
  responsible_role text not null,
  auto_flag boolean not null default true,
  is_active boolean not null default true,
  conditions jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.escalations (
  id uuid primary key default gen_random_uuid(),
  escalation_no text not null unique,
  title text not null,
  source_type text not null,
  source_id uuid,
  source_reference text,
  severity text not null check (severity in ('low','medium','high','critical')),
  escalation_level integer not null default 1 check (escalation_level between 1 and 10),
  responsible_role text not null,
  responsible_person_id uuid references public.profiles(id),
  department_id uuid references public.departments(id),
  due_date timestamptz,
  status text not null default 'open' check (status in ('open','acknowledged','in_progress','resolved','closed','cancelled')),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles(id),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  details jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.escalation_history (
  id uuid primary key default gen_random_uuid(),
  escalation_id uuid not null references public.escalations(id) on delete cascade,
  action text not null check (action in ('created','acknowledged','status_updated','resolved','closed','cancelled','rule_applied','notification_queued','dry_run')),
  actor_id uuid references public.profiles(id),
  previous_status text,
  new_status text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  escalation_id uuid references public.escalations(id) on delete cascade,
  recipient_id uuid references public.profiles(id),
  channel text not null check (channel in ('in_app','email','whatsapp','teams')),
  status text not null default 'pending' check (status in ('pending','claimed','processing','sent','failed','dead_letter')),
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists escalation_status_due_idx on public.escalations(status, due_date, severity);
create index if not exists escalation_source_idx on public.escalations(source_type, source_id, created_at desc);
create index if not exists escalation_history_lookup_idx on public.escalation_history(escalation_id, created_at desc);
create index if not exists escalation_rule_lookup_idx on public.escalation_rules(source_type, severity, is_active);
create index if not exists notification_outbox_status_idx on public.notification_outbox(status, next_attempt_at, created_at);

alter table public.escalation_rules enable row level security;
alter table public.escalations enable row level security;
alter table public.escalation_history enable row level security;
alter table public.notification_outbox enable row level security;

drop policy if exists staff_escalation_rules_all on public.escalation_rules;
create policy staff_escalation_rules_all on public.escalation_rules for all to authenticated using (private.is_staff()) with check (private.is_staff());
drop policy if exists staff_escalations_all on public.escalations;
create policy staff_escalations_all on public.escalations for all to authenticated using (private.is_staff()) with check (private.is_staff());
drop policy if exists staff_escalation_history_all on public.escalation_history;
create policy staff_escalation_history_all on public.escalation_history for all to authenticated using (private.is_staff()) with check (private.is_staff());
drop policy if exists staff_notification_outbox_all on public.notification_outbox;
create policy staff_notification_outbox_all on public.notification_outbox for all to authenticated using (private.is_staff()) with check (private.is_staff());

insert into public.permissions(code, description) values
 ('escalations.read','View HSE escalations and history'),
 ('escalations.manage','Create and update HSE escalations'),
 ('escalations.matrix.manage','Manage escalation matrix rules'),
 ('notifications.outbox.manage','Manage notification outbox')
on conflict (code) do nothing;
