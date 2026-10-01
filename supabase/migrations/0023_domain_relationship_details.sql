-- KSA SAFETY BOARD / Section 13B Domain Relationship Details

create table if not exists public.hse_workflow_links (
  id uuid primary key default gen_random_uuid(),
  workflow_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  relationship_type text not null default 'source',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(workflow_record_id,source_type,source_id,relationship_type),
  check (private.hse_record_is_type(workflow_record_id,array['workflow']))
);
create index if not exists hse_workflow_links_workflow_idx on public.hse_workflow_links(workflow_record_id,created_at);
create index if not exists hse_workflow_links_source_idx on public.hse_workflow_links(source_type,source_id);

create table if not exists public.hse_workflow_events (
  id uuid primary key default gen_random_uuid(),
  workflow_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  event_type text not null,
  previous_status text,
  new_status text,
  details jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (private.hse_record_is_type(workflow_record_id,array['workflow']))
);
create index if not exists hse_workflow_events_workflow_idx on public.hse_workflow_events(workflow_record_id,created_at desc);
create index if not exists hse_workflow_events_actor_idx on public.hse_workflow_events(actor_id);

create table if not exists public.safety_learning_notice_log (
  id uuid primary key default gen_random_uuid(),
  alert_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete set null,
  channel text not null default 'in_app',
  delivery_status text not null default 'pending' check (delivery_status in ('pending','sent','delivered','failed')),
  delivered_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (private.hse_record_is_type(alert_record_id,array['safety_learning']))
);
create index if not exists safety_learning_notice_alert_idx on public.safety_learning_notice_log(alert_record_id,created_at desc);
create index if not exists safety_learning_notice_recipient_idx on public.safety_learning_notice_log(recipient_id,created_at desc);

create table if not exists public.safety_learning_decisions (
  id uuid primary key default gen_random_uuid(),
  alert_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  decision text not null check (decision in ('approve','reject','revise','close')),
  rationale text,
  decided_by uuid not null references public.profiles(id),
  decided_at timestamptz not null default now(),
  check (private.hse_record_is_type(alert_record_id,array['safety_learning']))
);
create index if not exists safety_learning_decisions_alert_idx on public.safety_learning_decisions(alert_record_id,decided_at desc);
create index if not exists safety_learning_decisions_by_idx on public.safety_learning_decisions(decided_by);

create table if not exists public.occupational_health_surveillance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employee_directory(id) on delete cascade,
  requirement_record_id uuid references public.hse_operation_records(id) on delete set null,
  surveillance_type text not null,
  performed_on date,
  next_due_date date,
  outcome text,
  restrictions text,
  provider text,
  evidence_attachment_id uuid references public.attachments(id) on delete set null,
  confidential_summary text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requirement_record_id is null or private.hse_record_is_type(requirement_record_id,array['occupational_health_requirement']))
);
create index if not exists oh_surveillance_employee_idx on public.occupational_health_surveillance(employee_id,next_due_date);
create index if not exists oh_surveillance_requirement_idx on public.occupational_health_surveillance(requirement_record_id);
create index if not exists oh_surveillance_attachment_idx on public.occupational_health_surveillance(evidence_attachment_id);
create index if not exists oh_surveillance_created_by_idx on public.occupational_health_surveillance(created_by);

create table if not exists public.bowtie_threats (
  id uuid primary key default gen_random_uuid(),
  scenario_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  threat text not null,
  description text,
  likelihood text,
  linked_risk_type text,
  linked_risk_id uuid,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (private.hse_record_is_type(scenario_record_id,array['process_safety_scenario']))
);
create index if not exists bowtie_threats_scenario_idx on public.bowtie_threats(scenario_record_id,created_at);
create index if not exists bowtie_threats_risk_idx on public.bowtie_threats(linked_risk_type,linked_risk_id);
create index if not exists bowtie_threats_created_by_idx on public.bowtie_threats(created_by);

create table if not exists public.bowtie_consequences (
  id uuid primary key default gen_random_uuid(),
  scenario_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  consequence text not null,
  description text,
  severity text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (private.hse_record_is_type(scenario_record_id,array['process_safety_scenario']))
);
create index if not exists bowtie_consequences_scenario_idx on public.bowtie_consequences(scenario_record_id,created_at);
create index if not exists bowtie_consequences_created_by_idx on public.bowtie_consequences(created_by);

create table if not exists public.process_safety_barrier_links (
  id uuid primary key default gen_random_uuid(),
  scenario_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  barrier_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  side text not null check (side in ('preventive','mitigative')),
  linked_threat_id uuid references public.bowtie_threats(id) on delete cascade,
  linked_consequence_id uuid references public.bowtie_consequences(id) on delete cascade,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (private.hse_record_is_type(scenario_record_id,array['process_safety_scenario'])),
  check (private.hse_record_is_type(barrier_record_id,array['process_safety_barrier'])),
  check ((side='preventive' and linked_threat_id is not null and linked_consequence_id is null) or (side='mitigative' and linked_consequence_id is not null and linked_threat_id is null))
);
create index if not exists ps_barrier_links_scenario_idx on public.process_safety_barrier_links(scenario_record_id,side);
create index if not exists ps_barrier_links_barrier_idx on public.process_safety_barrier_links(barrier_record_id);
create index if not exists ps_barrier_links_threat_idx on public.process_safety_barrier_links(linked_threat_id);
create index if not exists ps_barrier_links_consequence_idx on public.process_safety_barrier_links(linked_consequence_id);
create index if not exists ps_barrier_links_created_by_idx on public.process_safety_barrier_links(created_by);

create table if not exists public.process_safety_barrier_impairments (
  id uuid primary key default gen_random_uuid(),
  barrier_record_id uuid not null references public.hse_operation_records(id) on delete cascade,
  status text not null default 'open' check (status in ('open','monitoring','restored','closed')),
  impairment_description text not null,
  started_at timestamptz not null default now(),
  expected_restore_at timestamptz,
  restored_at timestamptz,
  compensating_measures text,
  linked_action_id uuid references public.actions(id) on delete set null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (private.hse_record_is_type(barrier_record_id,array['process_safety_barrier']))
);
create index if not exists ps_barrier_impairments_barrier_idx on public.process_safety_barrier_impairments(barrier_record_id,status,expected_restore_at);
create index if not exists ps_barrier_impairments_action_idx on public.process_safety_barrier_impairments(linked_action_id);
create index if not exists ps_barrier_impairments_created_by_idx on public.process_safety_barrier_impairments(created_by);

create table if not exists public.equipment_service_records (
  id uuid primary key default gen_random_uuid(),
  equipment_passport_id uuid references public.equipment_passports(id) on delete cascade,
  safety_asset_id uuid references public.safety_assets(id) on delete cascade,
  service_type text not null,
  service_date date not null,
  provider text,
  findings text,
  actions_taken text,
  next_due_date date,
  evidence_attachment_id uuid references public.attachments(id) on delete set null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (equipment_passport_id is not null or safety_asset_id is not null)
);
create index if not exists equipment_service_passport_idx on public.equipment_service_records(equipment_passport_id,service_date desc);
create index if not exists equipment_service_asset_idx on public.equipment_service_records(safety_asset_id,service_date desc);
create index if not exists equipment_service_attachment_idx on public.equipment_service_records(evidence_attachment_id);
create index if not exists equipment_service_created_by_idx on public.equipment_service_records(created_by);

create table if not exists public.equipment_operator_authorizations (
  id uuid primary key default gen_random_uuid(),
  equipment_passport_id uuid references public.equipment_passports(id) on delete cascade,
  safety_asset_id uuid references public.safety_assets(id) on delete cascade,
  employee_id uuid not null references public.employee_directory(id) on delete cascade,
  authorization_id uuid references public.equipment_authorizations(id) on delete set null,
  valid_from date,
  valid_until date,
  status text not null default 'active' check (status in ('active','expired','suspended','revoked')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (equipment_passport_id is not null or safety_asset_id is not null)
);
create index if not exists equipment_operator_passport_idx on public.equipment_operator_authorizations(equipment_passport_id,status);
create index if not exists equipment_operator_asset_idx on public.equipment_operator_authorizations(safety_asset_id,status);
create index if not exists equipment_operator_employee_idx on public.equipment_operator_authorizations(employee_id,status);
create index if not exists equipment_operator_authorization_idx on public.equipment_operator_authorizations(authorization_id);
create index if not exists equipment_operator_created_by_idx on public.equipment_operator_authorizations(created_by);

create table if not exists public.contractor_scorecards (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  safety_score numeric(5,2) check (safety_score between 0 and 100),
  compliance_score numeric(5,2) check (compliance_score between 0 and 100),
  training_score numeric(5,2) check (training_score between 0 and 100),
  incident_score numeric(5,2) check (incident_score between 0 and 100),
  overall_score numeric(5,2) check (overall_score between 0 and 100),
  decision text check (decision in ('approved','conditional','suspended','blocked')),
  notes text,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);
create index if not exists contractor_scorecards_contractor_idx on public.contractor_scorecards(contractor_id,period_end desc);
create index if not exists contractor_scorecards_reviewed_by_idx on public.contractor_scorecards(reviewed_by);

create table if not exists public.fire_inspection_records (
  id uuid primary key default gen_random_uuid(),
  fire_equipment_id uuid references public.fire_equipment(id) on delete cascade,
  fire_device_id uuid references public.fire_devices(id) on delete cascade,
  inspection_date timestamptz not null default now(),
  result text not null check (result in ('pass','fail','defect','out_of_service')),
  findings text,
  action_required text,
  inspected_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (fire_equipment_id is not null or fire_device_id is not null)
);
create index if not exists fire_inspection_equipment_idx on public.fire_inspection_records(fire_equipment_id,inspection_date desc);
create index if not exists fire_inspection_device_idx on public.fire_inspection_records(fire_device_id,inspection_date desc);
create index if not exists fire_inspection_by_idx on public.fire_inspection_records(inspected_by);

create table if not exists public.fire_pump_records (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete set null,
  pump_ref text not null,
  recorded_at timestamptz not null default now(),
  pressure numeric,
  status text not null default 'normal' check (status in ('normal','warning','fault','out_of_service')),
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists fire_pump_site_idx on public.fire_pump_records(site_id,recorded_at desc);
create index if not exists fire_pump_by_idx on public.fire_pump_records(recorded_by);

create table if not exists public.fire_alarm_records (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid references public.fire_panels(id) on delete set null,
  event_type text not null check (event_type in ('alarm','pre_alarm','fault','supervisory','reset','test')),
  occurred_at timestamptz not null default now(),
  details text,
  acknowledged_by uuid references public.profiles(id),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists fire_alarm_panel_idx on public.fire_alarm_records(panel_id,occurred_at desc);
create index if not exists fire_alarm_ack_idx on public.fire_alarm_records(acknowledged_by);

create table if not exists public.fire_maintenance_records (
  id uuid primary key default gen_random_uuid(),
  fire_equipment_id uuid references public.fire_equipment(id) on delete cascade,
  fire_device_id uuid references public.fire_devices(id) on delete cascade,
  maintenance_type text not null,
  performed_at timestamptz not null default now(),
  provider text,
  findings text,
  work_performed text,
  next_due_date date,
  performed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (fire_equipment_id is not null or fire_device_id is not null)
);
create index if not exists fire_maintenance_equipment_idx on public.fire_maintenance_records(fire_equipment_id,performed_at desc);
create index if not exists fire_maintenance_device_idx on public.fire_maintenance_records(fire_device_id,performed_at desc);
create index if not exists fire_maintenance_by_idx on public.fire_maintenance_records(performed_by);

create table if not exists public.safety_radio_transmissions (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.safety_radio_channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists safety_radio_transmissions_channel_idx on public.safety_radio_transmissions(channel_id,started_at desc);
create index if not exists safety_radio_transmissions_user_idx on public.safety_radio_transmissions(user_id,started_at desc);

do $$
declare t text;
begin
  foreach t in array array[
    'hse_workflow_links','hse_workflow_events','safety_learning_notice_log','safety_learning_decisions',
    'occupational_health_surveillance','bowtie_threats','bowtie_consequences','process_safety_barrier_links',
    'process_safety_barrier_impairments','equipment_service_records','equipment_operator_authorizations',
    'contractor_scorecards','fire_inspection_records','fire_pump_records','fire_alarm_records',
    'fire_maintenance_records','safety_radio_transmissions'
  ]
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I_staff_all on public.%I',t,t);
    execute format('create policy %I_staff_all on public.%I for all to authenticated using (private.is_staff()) with check (private.is_staff())',t,t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('revoke all on public.%I from anon',t);
  end loop;
end $$;
