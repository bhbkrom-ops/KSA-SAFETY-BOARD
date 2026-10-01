-- KSA SAFETY BOARD / Section 11 Administration & System
insert into public.permissions(code,description) values
 ('users.read','View users and roles'),('activity.read','View activity log'),('plants.read','View facilities and work sites'),('plants.manage','Manage facilities and work sites'),('integrations.read','View integration readiness'),('integrations.manage','Manage integration delivery controls'),('system_readiness.read','View system readiness'),('system_readiness.manage','Process readiness actions'),('settings.read','View enterprise settings')
on conflict(code) do nothing;

alter table public.sites add column if not exists name_ar text;
alter table public.sites add column if not exists manager_name text;
alter table public.sites add column if not exists location text;
alter table public.sites add column if not exists industry text;
alter table public.sites add column if not exists status text not null default 'active' check(status in ('active','maintenance','inactive'));
create index if not exists sites_status_idx on public.sites(status,archived_at);

drop policy if exists staff_audit_insert on public.audit_logs;
create policy staff_audit_insert on public.audit_logs for insert to authenticated with check (private.is_staff());
grant insert on public.audit_logs to authenticated;

insert into public.system_settings(key,value) values
 ('integrations','{"email":{"enabled":false},"whatsapp":{"enabled":false},"teams":{"enabled":false},"in_app":{"enabled":true}}'::jsonb),
 ('document_numbering','{"ncr_prefix":"NCR","incident_prefix":"INC","report_prefix":"SOR"}'::jsonb),
 ('qr','{"enabled":true,"public_base_path":"/"}'::jsonb),
 ('print_templates','{"dpi":300,"paper":"A4","print_canvas":"white"}'::jsonb)
on conflict(key) do nothing;
