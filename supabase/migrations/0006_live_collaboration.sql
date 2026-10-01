-- KSA SAFETY BOARD / Live Collaboration
create type public.live_meeting_status as enum ('scheduled','live','completed','cancelled');
create type public.live_meeting_access_mode as enum ('authenticated','invite_only');
create type public.live_meeting_participant_role as enum ('host','participant');
create type public.live_meeting_participant_status as enum ('invited','joined','left','declined');

alter table public.actions drop constraint if exists actions_source_type_check;
alter table public.actions add constraint actions_source_type_check check (source_type in ('report','ncr','incident','risk','inspection','audit','drill','ptw','meeting'));

create table public.live_meetings (
  id uuid primary key default gen_random_uuid(),
  reference_no text unique not null,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  status public.live_meeting_status not null default 'scheduled',
  access_mode public.live_meeting_access_mode not null default 'authenticated',
  host_id uuid not null references public.profiles(id),
  site_id uuid references public.sites(id),
  invite_token_hash text unique,
  invite_expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_meeting_schedule_check check (scheduled_end is null or scheduled_end > scheduled_start),
  constraint live_meeting_invite_check check ((access_mode = 'invite_only' and invite_token_hash is not null) or access_mode = 'authenticated')
);

create table public.live_meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.live_meetings(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  invite_email text,
  display_name text,
  role public.live_meeting_participant_role not null default 'participant',
  status public.live_meeting_participant_status not null default 'invited',
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_meeting_participant_identity_check check (user_id is not null or invite_email is not null),
  unique (meeting_id, user_id),
  unique (meeting_id, invite_email)
);

create table public.live_meeting_messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.live_meetings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.live_meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references public.live_meetings(id) on delete cascade,
  content text not null default '',
  decisions text,
  action_items jsonb not null default '[]'::jsonb check (jsonb_typeof(action_items) = 'array'),
  version integer not null default 1 check (version > 0),
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index live_meetings_status_start_idx on public.live_meetings(status, scheduled_start desc);
create index live_meetings_host_idx on public.live_meetings(host_id, scheduled_start desc);
create index live_meeting_participants_user_idx on public.live_meeting_participants(user_id, status);
create index live_meeting_messages_meeting_idx on public.live_meeting_messages(meeting_id, created_at desc);
create index live_meeting_minutes_meeting_idx on public.live_meeting_minutes(meeting_id);

create or replace function private.is_live_meeting_member(target_meeting_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.live_meeting_participants p
    where p.meeting_id = target_meeting_id and p.user_id = (select auth.uid()) and p.status <> 'declined'
  ) or exists (
    select 1 from public.live_meetings m
    where m.id = target_meeting_id and m.host_id = (select auth.uid())
  );
$$;
grant execute on function private.is_live_meeting_member(uuid) to authenticated;

alter table public.live_meetings enable row level security;
alter table public.live_meeting_participants enable row level security;
alter table public.live_meeting_messages enable row level security;
alter table public.live_meeting_minutes enable row level security;

create policy live_meetings_select on public.live_meetings for select to authenticated using (private.is_staff() or host_id = (select auth.uid()) or private.is_live_meeting_member(id));
create policy live_meetings_insert on public.live_meetings for insert to authenticated with check (private.is_staff() and host_id = (select auth.uid()) and created_by = (select auth.uid()));
create policy live_meetings_update on public.live_meetings for update to authenticated using (private.is_staff() and (host_id = (select auth.uid()) or private.is_staff())) with check (private.is_staff());
create policy live_meetings_delete on public.live_meetings for delete to authenticated using (private.is_staff() and host_id = (select auth.uid()));

create policy live_meeting_participants_select on public.live_meeting_participants for select to authenticated using (private.is_staff() or user_id = (select auth.uid()) or private.is_live_meeting_member(meeting_id));
create policy live_meeting_participants_insert on public.live_meeting_participants for insert to authenticated with check (private.is_staff() and private.is_live_meeting_member(meeting_id));
create policy live_meeting_participants_update on public.live_meeting_participants for update to authenticated using (private.is_staff() or user_id = (select auth.uid())) with check (private.is_staff() or user_id = (select auth.uid()));
create policy live_meeting_participants_delete on public.live_meeting_participants for delete to authenticated using (private.is_staff());

create policy live_meeting_messages_select on public.live_meeting_messages for select to authenticated using (private.is_live_meeting_member(meeting_id));
create policy live_meeting_messages_insert on public.live_meeting_messages for insert to authenticated with check (private.is_live_meeting_member(meeting_id) and sender_id = (select auth.uid()));

create policy live_meeting_minutes_select on public.live_meeting_minutes for select to authenticated using (private.is_staff() or private.is_live_meeting_member(meeting_id));
create policy live_meeting_minutes_insert on public.live_meeting_minutes for insert to authenticated with check (private.is_staff() and private.is_live_meeting_member(meeting_id) and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy live_meeting_minutes_update on public.live_meeting_minutes for update to authenticated using (private.is_staff() and private.is_live_meeting_member(meeting_id)) with check (private.is_staff() and private.is_live_meeting_member(meeting_id) and updated_by = (select auth.uid()));

create or replace function private.live_meeting_audit_trigger() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs(actor_id, event_type, entity_type, entity_id, previous_data, new_data)
  values ((select auth.uid()), TG_OP, TG_TABLE_NAME, coalesce(new.id, old.id), case when TG_OP = 'INSERT' then null else to_jsonb(old) end, case when TG_OP = 'DELETE' then null else to_jsonb(new) end);
  return coalesce(new, old);
end;
$$;
create trigger live_meetings_audit after insert or update or delete on public.live_meetings for each row execute procedure private.live_meeting_audit_trigger();
create trigger live_meeting_minutes_audit after insert or update or delete on public.live_meeting_minutes for each row execute procedure private.live_meeting_audit_trigger();

alter publication supabase_realtime add table public.live_meetings;
alter publication supabase_realtime add table public.live_meeting_participants;
alter publication supabase_realtime add table public.live_meeting_messages;
alter publication supabase_realtime add table public.live_meeting_minutes;
