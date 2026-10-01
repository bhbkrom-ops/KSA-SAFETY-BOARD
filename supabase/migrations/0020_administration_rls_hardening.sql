-- KSA SAFETY BOARD / Section 11 administration RLS hardening

create or replace function private.is_admin_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select role_code in ('super_admin','hse_manager')
    from public.profiles
    where id = (select auth.uid()) and is_active
  ), false);
$$;

revoke all on function private.is_admin_manager() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin_manager() to authenticated;

drop policy if exists staff_role_permissions_all on public.role_permissions;
drop policy if exists admin_role_permissions_select on public.role_permissions;
drop policy if exists admin_role_permissions_insert on public.role_permissions;
drop policy if exists admin_role_permissions_update on public.role_permissions;
drop policy if exists admin_role_permissions_delete on public.role_permissions;
create policy admin_role_permissions_select on public.role_permissions
  for select to authenticated using (private.is_staff());
create policy admin_role_permissions_insert on public.role_permissions
  for insert to authenticated with check (private.is_admin_manager());
create policy admin_role_permissions_update on public.role_permissions
  for update to authenticated using (private.is_admin_manager()) with check (private.is_admin_manager());
create policy admin_role_permissions_delete on public.role_permissions
  for delete to authenticated using (private.is_admin_manager());

drop policy if exists staff_user_roles_all on public.user_roles;
drop policy if exists admin_user_roles_select on public.user_roles;
drop policy if exists admin_user_roles_insert on public.user_roles;
drop policy if exists admin_user_roles_update on public.user_roles;
drop policy if exists admin_user_roles_delete on public.user_roles;
create policy admin_user_roles_select on public.user_roles
  for select to authenticated using (private.is_staff());
create policy admin_user_roles_insert on public.user_roles
  for insert to authenticated with check (private.is_admin_manager());
create policy admin_user_roles_update on public.user_roles
  for update to authenticated using (private.is_admin_manager()) with check (private.is_admin_manager());
create policy admin_user_roles_delete on public.user_roles
  for delete to authenticated using (private.is_admin_manager());

drop policy if exists staff_sites_all on public.sites;
drop policy if exists admin_sites_select on public.sites;
drop policy if exists admin_sites_insert on public.sites;
drop policy if exists admin_sites_update on public.sites;
drop policy if exists admin_sites_delete on public.sites;
create policy admin_sites_select on public.sites
  for select to authenticated using (private.is_staff());
create policy admin_sites_insert on public.sites
  for insert to authenticated with check (private.is_admin_manager());
create policy admin_sites_update on public.sites
  for update to authenticated using (private.is_admin_manager()) with check (private.is_admin_manager());
create policy admin_sites_delete on public.sites
  for delete to authenticated using (private.is_admin_manager());

drop policy if exists staff_settings_all on public.system_settings;
drop policy if exists admin_settings_select on public.system_settings;
drop policy if exists admin_settings_insert on public.system_settings;
drop policy if exists admin_settings_update on public.system_settings;
drop policy if exists admin_settings_delete on public.system_settings;
create policy admin_settings_select on public.system_settings
  for select to authenticated using (private.is_staff());
create policy admin_settings_insert on public.system_settings
  for insert to authenticated with check (private.is_admin_manager());
create policy admin_settings_update on public.system_settings
  for update to authenticated using (private.is_admin_manager()) with check (private.is_admin_manager());
create policy admin_settings_delete on public.system_settings
  for delete to authenticated using (private.is_admin_manager());
