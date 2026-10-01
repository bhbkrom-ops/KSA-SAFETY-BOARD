-- KSA SAFETY BOARD / ESP Safety Vision
insert into public.permissions (code, description) values
  ('vision.read', 'View Safety Vision operations'),
  ('vision.manage', 'Manage cameras, devices, rules, zones, and settings'),
  ('vision.alerts.ack', 'Acknowledge and resolve Vision alerts')
on conflict (code) do nothing;

create table public.vision_devices (
  id uuid primary key default gen_random_uuid(),
  device_code text unique not null,
  name text not null check (char_length(trim(name)) between 2 and 160),
  device_type text not null default 'edge_ai',
  site_id uuid references public.sites(id),
  status text not null default 'registered' check (status in ('registered','provisioning','active','degraded','offline','maintenance','revoked','retired')),
  firmware_version text,
  hardware_model text,
  mac_address text,
  ip_address inet,
  last_seen_at timestamptz,
  heartbeat_at timestamptz,
  cpu_percent numeric(5,2) check (cpu_percent is null or cpu_percent between 0 and 100),
  memory_percent numeric(5,2) check (memory_percent is null or memory_percent between 0 and 100),
  temperature_c numeric(6,2),
  storage_percent numeric(5,2) check (storage_percent is null or storage_percent between 0 and 100),
  network_strength numeric(5,2) check (network_strength is null or network_strength between 0 and 100),
  provisioning_state text not null default 'unprovisioned' check (provisioning_state in ('unprovisioned','pending','provisioned','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vision_cameras (
  id uuid primary key default gen_random_uuid(),
  camera_code text unique not null,
  name text not null check (char_length(trim(name)) between 2 and 160),
  site_id uuid references public.sites(id),
  building text,
  floor text,
  area text,
  zone text,
  camera_type text not null default 'fixed_bullet',
  ip_address inet,
  rtsp_endpoint text,
  rtsp_configured boolean not null default false,
  stream_gateway_type text not null default 'none' check (stream_gateway_type in ('none','webrtc','hls','ll_hls')),
  stream_gateway_ref text,
  resolution text,
  fps integer check (fps is null or fps between 1 and 240),
  firmware_version text,
  nvr_server text,
  nvr_channel text,
  recording_enabled boolean not null default false,
  analytics_enabled boolean not null default false,
  enabled boolean not null default true,
  camera_state text not null default 'unknown' check (camera_state in ('online','offline','warning','degraded','maintenance','disabled','unknown')),
  stream_state text not null default 'unknown' check (stream_state in ('healthy','offline','error','not_configured','unknown')),
  analytics_state text not null default 'unknown' check (analytics_state in ('healthy','offline','degraded','not_configured','unknown')),
  last_seen_at timestamptz,
  last_frame_at timestamptz,
  reconnect_count integer not null default 0 check (reconnect_count >= 0),
  position jsonb not null default '{}'::jsonb,
  device_id uuid references public.vision_devices(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vision_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  category text not null check (category in ('ppe','restricted_zone','equipment','behavioral','fire_smoke','people_vehicle','proximity')),
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'active' check (status in ('active','inactive')),
  camera_id uuid references public.vision_cameras(id) on delete set null,
  zone_id uuid,
  conditions jsonb not null default '{}'::jsonb,
  notification_config jsonb not null default '{}'::jsonb,
  hse_workflow_config jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vision_restricted_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  camera_id uuid not null references public.vision_cameras(id) on delete cascade,
  shape_type text not null check (shape_type in ('polygon','rectangle','line_crossing')),
  geometry jsonb not null check (jsonb_typeof(geometry) = 'object'),
  severity text not null default 'high' check (severity in ('low','medium','high','critical')),
  schedule jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vision_rules add constraint vision_rules_zone_fk foreign key (zone_id) references public.vision_restricted_zones(id) on delete set null;

create table public.vision_alerts (
  id uuid primary key default gen_random_uuid(),
  event_key text unique not null,
  category text not null check (category in ('ppe','restricted_zone','equipment','behavioral','fire_smoke','people_vehicle','proximity')),
  violation_type text not null,
  severity text not null check (severity in ('low','medium','high','critical')),
  status text not null default 'new' check (status in ('new','acknowledged','under_review','resolved','false_positive')),
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  camera_id uuid references public.vision_cameras(id) on delete set null,
  device_id uuid references public.vision_devices(id) on delete set null,
  zone_id uuid references public.vision_restricted_zones(id) on delete set null,
  rule_id uuid references public.vision_rules(id) on delete set null,
  event_timestamp timestamptz not null,
  received_at timestamptz not null default now(),
  processing_timestamp timestamptz,
  thumbnail_ref text,
  recording_id uuid,
  human_verified boolean,
  acknowledgement_note text,
  acknowledged_by uuid references public.profiles(id),
  acknowledged_at timestamptz,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.vision_recordings (
  id uuid primary key default gen_random_uuid(),
  camera_id uuid not null references public.vision_cameras(id) on delete cascade,
  alert_id uuid references public.vision_alerts(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  storage_ref text,
  nvr_server text,
  nvr_channel text,
  clip_available boolean not null default false,
  export_status text not null default 'not_requested' check (export_status in ('not_requested','requested','ready','failed','expired')),
  retention_expires_at timestamptz,
  legal_hold boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.vision_alerts add constraint vision_alerts_recording_fk foreign key (recording_id) references public.vision_recordings(id) on delete set null;

create table public.vision_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.vision_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  ip_address inet,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index vision_cameras_state_idx on public.vision_cameras(camera_state, enabled);
create index vision_cameras_site_area_idx on public.vision_cameras(site_id, area, zone);
create index vision_devices_status_seen_idx on public.vision_devices(status, last_seen_at desc);
create index vision_alerts_status_severity_idx on public.vision_alerts(status, severity, event_timestamp desc);
create index vision_alerts_camera_time_idx on public.vision_alerts(camera_id, event_timestamp desc);
create index vision_alerts_category_idx on public.vision_alerts(category, event_timestamp desc);
create index vision_recordings_camera_time_idx on public.vision_recordings(camera_id, started_at desc);
create index vision_zones_camera_idx on public.vision_restricted_zones(camera_id, enabled);
create index vision_audit_target_idx on public.vision_audit_logs(target_type, target_id, created_at desc);

alter table public.vision_devices enable row level security;
alter table public.vision_cameras enable row level security;
alter table public.vision_rules enable row level security;
alter table public.vision_restricted_zones enable row level security;
alter table public.vision_alerts enable row level security;
alter table public.vision_recordings enable row level security;
alter table public.vision_settings enable row level security;
alter table public.vision_audit_logs enable row level security;

create policy vision_devices_staff_all on public.vision_devices for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy vision_cameras_staff_all on public.vision_cameras for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy vision_rules_staff_all on public.vision_rules for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy vision_zones_staff_all on public.vision_restricted_zones for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy vision_alerts_staff_select on public.vision_alerts for select to authenticated using (private.is_staff());
create policy vision_alerts_staff_update on public.vision_alerts for update to authenticated using (private.is_staff()) with check (private.is_staff());
create policy vision_recordings_staff_select on public.vision_recordings for select to authenticated using (private.is_staff());
create policy vision_settings_staff_all on public.vision_settings for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy vision_audit_staff_select on public.vision_audit_logs for select to authenticated using (private.is_staff());

grant select, insert, update, delete on public.vision_devices, public.vision_cameras, public.vision_rules, public.vision_restricted_zones, public.vision_alerts, public.vision_recordings, public.vision_settings, public.vision_audit_logs to authenticated;
revoke all on public.vision_devices, public.vision_cameras, public.vision_rules, public.vision_restricted_zones, public.vision_alerts, public.vision_recordings, public.vision_settings, public.vision_audit_logs from anon;

create or replace function private.vision_audit_trigger() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.vision_audit_logs(actor_id, action, target_type, target_id, metadata)
  values ((select auth.uid()), TG_OP, TG_TABLE_NAME, coalesce(new.id, old.id), jsonb_build_object('previous', case when TG_OP = 'INSERT' then null else to_jsonb(old) end, 'current', case when TG_OP = 'DELETE' then null else to_jsonb(new) end));
  return coalesce(new, old);
end;
$$;
create trigger vision_cameras_audit after insert or update or delete on public.vision_cameras for each row execute procedure private.vision_audit_trigger();
create trigger vision_devices_audit after insert or update or delete on public.vision_devices for each row execute procedure private.vision_audit_trigger();
create trigger vision_rules_audit after insert or update or delete on public.vision_rules for each row execute procedure private.vision_audit_trigger();
create trigger vision_zones_audit after insert or update or delete on public.vision_restricted_zones for each row execute procedure private.vision_audit_trigger();

alter publication supabase_realtime add table public.vision_cameras;
alter publication supabase_realtime add table public.vision_devices;
alter publication supabase_realtime add table public.vision_alerts;
