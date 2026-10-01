-- Section 15: authentication security state and append-only security events.
create table if not exists public.auth_security_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  failed_login_count integer not null default 0 check (failed_login_count >= 0),
  locked_until timestamptz,
  session_cutoff_at timestamptz,
  password_changed_at timestamptz,
  last_failed_at timestamptz,
  last_success_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.auth_security_state enable row level security;
drop policy if exists auth_security_state_select_self on public.auth_security_state;
drop policy if exists auth_security_state_select_admin on public.auth_security_state;
create policy auth_security_state_select_self on public.auth_security_state
for select to authenticated using (user_id=(select auth.uid()));
create policy auth_security_state_select_admin on public.auth_security_state
for select to authenticated using (private.is_admin_manager());
revoke insert,update,delete on public.auth_security_state from anon,authenticated;
grant select on public.auth_security_state to authenticated;
create index if not exists auth_security_locked_idx on public.auth_security_state(locked_until) where locked_until is not null;

create table if not exists public.auth_security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  success boolean not null default false,
  email_hash text,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.auth_security_events enable row level security;
drop policy if exists auth_security_events_admin_select on public.auth_security_events;
create policy auth_security_events_admin_select on public.auth_security_events
for select to authenticated using (private.is_admin_manager());
revoke insert,update,delete on public.auth_security_events from anon,authenticated;
grant select on public.auth_security_events to authenticated;
create index if not exists auth_security_events_user_idx on public.auth_security_events(user_id,created_at desc);
create index if not exists auth_security_events_type_idx on public.auth_security_events(event_type,created_at desc);
create index if not exists auth_security_events_email_hash_idx on public.auth_security_events(email_hash,created_at desc);

create or replace function private.initialize_auth_security_state()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into public.auth_security_state(user_id)
  values(new.id)
  on conflict(user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.initialize_auth_security_state() from public,anon,authenticated;

drop trigger if exists profiles_initialize_auth_security on public.profiles;
create trigger profiles_initialize_auth_security
after insert on public.profiles
for each row execute function private.initialize_auth_security_state();

insert into public.auth_security_state(user_id)
select id from public.profiles
on conflict(user_id) do nothing;
