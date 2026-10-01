-- KSA SAFETY BOARD / Vision advanced event governance
alter table public.vision_alerts
  add column if not exists detection_type text,
  add column if not exists object_type text,
  add column if not exists model_name text,
  add column if not exists model_version text,
  add column if not exists rule_threshold numeric(5,4),
  add column if not exists tracking_id text,
  add column if not exists dedupe_key text,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_reason text,
  add column if not exists hse_link_type text,
  add column if not exists hse_link_id uuid;

create index if not exists vision_alerts_dedupe_idx on public.vision_alerts(dedupe_key, event_timestamp desc);
create index if not exists vision_alerts_tracking_idx on public.vision_alerts(camera_id, tracking_id, event_timestamp desc);

create or replace function private.vision_audit_trigger() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.vision_audit_logs(actor_id, action, target_type, target_id, ip_address, metadata)
  values ((select auth.uid()), TG_OP, TG_TABLE_NAME, coalesce(new.id, old.id), inet_client_addr(), jsonb_build_object('previous', case when TG_OP = 'INSERT' then null else to_jsonb(old) end, 'current', case when TG_OP = 'DELETE' then null else to_jsonb(new) end));
  return coalesce(new, old);
end;
$$;

drop trigger if exists vision_alerts_audit on public.vision_alerts;
create trigger vision_alerts_audit after insert or update or delete on public.vision_alerts for each row execute procedure private.vision_audit_trigger();
drop trigger if exists vision_settings_audit on public.vision_settings;
create trigger vision_settings_audit after insert or update or delete on public.vision_settings for each row execute procedure private.vision_audit_trigger();
