-- Section 15 public reporting tracking, confidential identity vault, messaging and rate limiting.

create table if not exists public.public_report_access (
  report_id uuid primary key references public.reports(id) on delete cascade,
  tracking_code_hash text not null,
  identity_mode text not null check (identity_mode in ('anonymous','confidential','identified')),
  identity_ciphertext text,
  identity_iv text,
  identity_tag text,
  identity_revealed_at timestamptz,
  identity_revealed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.public_report_access enable row level security;
revoke all on public.public_report_access from anon, authenticated;
grant select,update on public.public_report_access to authenticated;
drop policy if exists public_report_access_privileged_select on public.public_report_access;
drop policy if exists public_report_access_privileged_update on public.public_report_access;
create policy public_report_access_privileged_select on public.public_report_access
for select to authenticated using (private.is_admin_manager());
create policy public_report_access_privileged_update on public.public_report_access
for update to authenticated using (private.is_admin_manager()) with check (private.is_admin_manager());
create unique index if not exists public_report_access_tracking_hash_uidx on public.public_report_access(tracking_code_hash);

create table if not exists public.public_report_messages (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  sender_type text not null check (sender_type in ('reporter','hse')),
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.public_report_messages enable row level security;
revoke all on public.public_report_messages from anon;
grant select,insert on public.public_report_messages to authenticated;
drop policy if exists public_report_messages_staff_select on public.public_report_messages;
drop policy if exists public_report_messages_staff_insert on public.public_report_messages;
create policy public_report_messages_staff_select on public.public_report_messages
for select to authenticated using (private.is_staff());
create policy public_report_messages_staff_insert on public.public_report_messages
for insert to authenticated with check (
  private.is_staff()
  and sender_type='hse'
  and sender_id=(select auth.uid())
);

create table if not exists public.public_report_rate_limits (
  key_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (key_hash, window_start)
);
alter table public.public_report_rate_limits enable row level security;
revoke all on public.public_report_rate_limits from anon, authenticated;

create index if not exists public_report_messages_report_idx
  on public.public_report_messages(report_id, created_at);
create index if not exists public_report_rate_limits_updated_idx
  on public.public_report_rate_limits(updated_at);

comment on table public.public_report_access is 'Server-mediated tracking credentials and encrypted reporter identity. No anonymous direct access.';
comment on table public.public_report_messages is 'Public reporter/HSE thread. Reporter access is server-mediated through tracking credentials.';
