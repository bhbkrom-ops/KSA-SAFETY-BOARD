-- KSA SAFETY BOARD / Section 13A Data Model & Cross-Module Traceability
-- Adds relational detail around the existing top-level records without duplicating current modules.

create or replace function private.hse_record_is_type(p_record_id uuid, p_allowed text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select resource_type = any(p_allowed) from public.hse_operation_records where id = p_record_id),
    false
  );
$$;
revoke all on function private.hse_record_is_type(uuid,text[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.hse_record_is_type(uuid,text[]) to authenticated;

create table if not exists public.hse_record_links (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  relationship_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(source_type, source_id, target_type, target_id, relationship_type)
);
create index if not exists hse_record_links_source_idx on public.hse_record_links(source_type,source_id,created_at desc);
create index if not exists hse_record_links_target_idx on public.hse_record_links(target_type,target_id,created_at desc);
create index if not exists hse_record_links_created_by_idx on public.hse_record_links(created_by);

create table if not exists public.action_comments (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists action_comments_action_idx on public.action_comments(action_id,created_at);
create index if not exists action_comments_created_by_idx on public.action_comments(created_by);

create table if not exists public.action_evidence (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  attachment_id uuid references public.attachments(id) on delete set null,
  evidence_url text,
  evidence_type text not null default 'supporting' check (evidence_type in ('supporting','verification','effectiveness','closure')),
  description text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (attachment_id is not null or evidence_url is not null)
);
create index if not exists action_evidence_action_idx on public.action_evidence(action_id,created_at);
create index if not exists action_evidence_attachment_idx on public.action_evidence(attachment_id);
create index if not exists action_evidence_uploaded_by_idx on public.action_evidence(uploaded_by);

create table if not exists public.action_history (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  event_type text not null,
  previous_data jsonb,
  new_data jsonb,
  reason text,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists action_history_action_idx on public.action_history(action_id,created_at desc);
create index if not exists action_history_actor_idx on public.action_history(actor_id);

create table if not exists public.action_escalations (
  action_id uuid not null references public.actions(id) on delete cascade,
  escalation_id uuid not null references public.escalations(id) on delete cascade,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key(action_id, escalation_id)
);
create index if not exists action_escalations_escalation_idx on public.action_escalations(escalation_id);
create index if not exists action_escalations_created_by_idx on public.action_escalations(created_by);

create table if not exists public.jsa_steps (
  id uuid primary key default gen_random_uuid(),
  jsa_id uuid not null references public.job_safety_analyses(id) on delete cascade,
  step_no integer not null check (step_no > 0),
  task_step text not null,
  hazards jsonb not null default '[]'::jsonb,
  controls jsonb not null default '[]'::jsonb,
  responsible_person text,
  residual_risk text,
  ppe jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(jsa_id, step_no)
);
create index if not exists jsa_steps_jsa_idx on public.jsa_steps(jsa_id,step_no);

create table if not exists public.jsa_acknowledgements (
  jsa_id uuid not null references public.job_safety_analyses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  acknowledgement text,
  acknowledged_at timestamptz not null default now(),
  primary key(jsa_id,user_id)
);
create index if not exists jsa_ack_user_idx on public.jsa_acknowledgements(user_id,acknowledged_at desc);

create table if not exists public.moc_reviews (
  id uuid primary key default gen_random_uuid(),
  moc_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  review_type text not null,
  reviewer_id uuid references public.profiles(id),
  decision text not null default 'pending' check (decision in ('pending','approved','approved_with_conditions','rejected')),
  comments text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (private.hse_record_is_type(moc_record_id, array['management_of_change']))
);
create index if not exists moc_reviews_record_idx on public.moc_reviews(moc_record_id,created_at);
create index if not exists moc_reviews_reviewer_idx on public.moc_reviews(reviewer_id);

create table if not exists public.moc_pssr_items (
  id uuid primary key default gen_random_uuid(),
  moc_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  item_no integer not null check (item_no > 0),
  requirement text not null,
  status text not null default 'pending' check (status in ('pending','pass','fail','not_applicable')),
  evidence text,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(moc_record_id,item_no),
  check (private.hse_record_is_type(moc_record_id, array['management_of_change']))
);
create index if not exists moc_pssr_record_idx on public.moc_pssr_items(moc_record_id,item_no);
create index if not exists moc_pssr_verified_by_idx on public.moc_pssr_items(verified_by);

create table if not exists public.critical_control_verifications (
  id uuid primary key default gen_random_uuid(),
  critical_control_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  verification_date timestamptz not null default now(),
  verifier_id uuid references public.profiles(id),
  method text,
  result text not null check (result in ('effective','degraded','failed')),
  evidence text,
  notes text,
  linked_action_id uuid references public.actions(id),
  created_at timestamptz not null default now(),
  check (private.hse_record_is_type(critical_control_record_id, array['critical_control']))
);
create index if not exists ccv_record_idx on public.critical_control_verifications(critical_control_record_id,verification_date desc);
create index if not exists ccv_verifier_idx on public.critical_control_verifications(verifier_id);
create index if not exists ccv_action_idx on public.critical_control_verifications(linked_action_id);

create table if not exists public.safety_learning_recipients (
  id uuid primary key default gen_random_uuid(),
  alert_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  acknowledgement_required boolean not null default true,
  acknowledged_at timestamptz,
  acknowledgement_comment text,
  effectiveness_status text check (effectiveness_status in ('pending','effective','ineffective','not_required')),
  effectiveness_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(alert_record_id,recipient_id),
  check (private.hse_record_is_type(alert_record_id, array['safety_learning']))
);
create index if not exists safety_learning_recipient_alert_idx on public.safety_learning_recipients(alert_record_id,acknowledged_at);
create index if not exists safety_learning_recipient_user_idx on public.safety_learning_recipients(recipient_id,acknowledged_at);

create table if not exists public.hse_shift_handover_items (
  id uuid primary key default gen_random_uuid(),
  handover_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  item_type text not null,
  details text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  owner_id uuid references public.employee_directory(id),
  due_date date,
  source_type text,
  source_id uuid,
  status text not null default 'open' check (status in ('open','in_progress','completed','carried_forward','cancelled')),
  carried_to_handover_id uuid references public.hse_operation_records(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (private.hse_record_is_type(handover_record_id, array['shift_handover'])),
  check (carried_to_handover_id is null or private.hse_record_is_type(carried_to_handover_id, array['shift_handover']))
);
create index if not exists handover_items_record_idx on public.hse_shift_handover_items(handover_record_id,status,priority);
create index if not exists handover_items_owner_idx on public.hse_shift_handover_items(owner_id,due_date);
create index if not exists handover_items_carried_idx on public.hse_shift_handover_items(carried_to_handover_id);

insert into public.permissions(code,description) values
 ('traceability.read','View cross-module traceability'),
 ('traceability.manage','Manage cross-module links and evidence')
on conflict(code) do nothing;

do $$
declare t text;
begin
  foreach t in array array[
    'hse_record_links','action_comments','action_evidence','action_history','action_escalations',
    'jsa_steps','jsa_acknowledgements','moc_reviews','moc_pssr_items',
    'critical_control_verifications','safety_learning_recipients','hse_shift_handover_items'
  ]
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I_staff_all on public.%I',t,t);
    execute format('create policy %I_staff_all on public.%I for all to authenticated using (private.is_staff()) with check (private.is_staff())',t,t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('revoke all on public.%I from anon',t);
  end loop;
end $$;
