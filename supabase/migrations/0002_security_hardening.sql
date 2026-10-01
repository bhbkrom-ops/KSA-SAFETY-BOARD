-- Security hardening: keep authorization helpers out of the exposed public schema.
create schema if not exists private;

create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure private.handle_new_user();

drop policy if exists profiles_self_select on public.profiles;
drop policy if exists staff_reports_select on public.reports;
drop policy if exists staff_reports_write on public.reports;
drop policy if exists staff_actions_all on public.actions;
drop policy if exists staff_incidents_all on public.incidents;
drop policy if exists staff_ncr_all on public.ncr;
drop policy if exists staff_capa_all on public.capa;
drop policy if exists staff_risk_all on public.risk_assessments;
drop policy if exists staff_hazard_all on public.risk_hazards;
drop policy if exists staff_audit_select on public.audit_logs;

drop function if exists public.handle_new_user();
drop function if exists public.is_staff();

create or replace function private.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role_code in ('super_admin','hse_manager','hse_leader','hse_supervisor','senior_safety_officer','safety_officer','auditor') from public.profiles where id = (select auth.uid()) and is_active), false);
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_staff() to authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.departments enable row level security;
alter table public.sites enable row level security;
alter table public.buildings enable row level security;
alter table public.work_areas enable row level security;
alter table public.user_roles enable row level security;
alter table public.system_settings enable row level security;

create policy profiles_self_select on public.profiles for select using (id = (select auth.uid()) or private.is_staff());
create policy staff_reports_select on public.reports for select to authenticated using (private.is_staff());
create policy staff_reports_write on public.reports for update to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_actions_all on public.actions for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_incidents_all on public.incidents for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_ncr_all on public.ncr for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_capa_all on public.capa for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_risk_all on public.risk_assessments for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_hazard_all on public.risk_hazards for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_audit_select on public.audit_logs for select to authenticated using (private.is_staff());
create policy staff_roles_select on public.roles for select to authenticated using (private.is_staff());
create policy staff_permissions_select on public.permissions for select to authenticated using (private.is_staff());
create policy staff_role_permissions_all on public.role_permissions for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_departments_all on public.departments for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_sites_all on public.sites for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_buildings_all on public.buildings for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_work_areas_all on public.work_areas for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_user_roles_all on public.user_roles for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_settings_all on public.system_settings for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_attachments_all on public.attachments for all to authenticated using (private.is_staff()) with check (private.is_staff());
create policy staff_report_attachments_all on public.report_attachments for all to authenticated using (private.is_staff()) with check (private.is_staff());

create index if not exists actions_created_by_idx on public.actions(created_by);
create index if not exists actions_verified_by_idx on public.actions(verified_by);
create index if not exists attachments_uploaded_by_idx on public.attachments(uploaded_by);
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists capa_action_id_idx on public.capa(action_id);
create index if not exists capa_ncr_id_idx on public.capa(ncr_id);
create index if not exists capa_reviewed_by_idx on public.capa(reviewed_by);
create index if not exists incidents_approved_by_idx on public.incidents(approved_by);
create index if not exists incidents_created_by_idx on public.incidents(created_by);
create index if not exists incidents_investigator_id_idx on public.incidents(investigator_id);
create index if not exists incidents_site_id_idx on public.incidents(site_id);
create index if not exists incidents_work_area_id_idx on public.incidents(work_area_id);
create index if not exists ncr_approved_by_idx on public.ncr(approved_by);
create index if not exists ncr_created_by_idx on public.ncr(created_by);
create index if not exists ncr_department_id_idx on public.ncr(department_id);
create index if not exists ncr_owner_id_idx on public.ncr(owner_id);
create index if not exists ncr_site_id_idx on public.ncr(site_id);
create index if not exists notifications_recipient_id_idx on public.notifications(recipient_id);
create index if not exists profiles_department_id_idx on public.profiles(department_id);
create index if not exists profiles_site_id_idx on public.profiles(site_id);
create index if not exists report_attachments_attachment_id_idx on public.report_attachments(attachment_id);
create index if not exists reports_department_id_idx on public.reports(department_id);
create index if not exists reports_reporter_id_idx on public.reports(reporter_id);
create index if not exists reports_responsible_id_idx on public.reports(responsible_id);
create index if not exists reports_work_area_id_idx on public.reports(work_area_id);
create index if not exists risk_assessments_approved_by_idx on public.risk_assessments(approved_by);
create index if not exists risk_assessments_owner_id_idx on public.risk_assessments(owner_id);
create index if not exists risk_assessments_site_id_idx on public.risk_assessments(site_id);
create index if not exists risk_assessments_work_area_id_idx on public.risk_assessments(work_area_id);
create index if not exists risk_hazards_assessment_id_idx on public.risk_hazards(assessment_id);
create index if not exists risk_hazards_responsible_id_idx on public.risk_hazards(responsible_id);
create index if not exists role_permissions_permission_id_idx on public.role_permissions(permission_id);
create index if not exists system_settings_updated_by_idx on public.system_settings(updated_by);
create index if not exists user_roles_assigned_by_idx on public.user_roles(assigned_by);
create index if not exists user_roles_role_id_idx on public.user_roles(role_id);
create index if not exists user_roles_user_id_idx on public.user_roles(user_id);
create index if not exists work_areas_building_id_idx on public.work_areas(building_id);
