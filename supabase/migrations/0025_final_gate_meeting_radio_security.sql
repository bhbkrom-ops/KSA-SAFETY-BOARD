-- Section 14: harden live meeting role rules and safety radio floor ownership.

create or replace function private.can_manage_live_meeting(target_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select private.is_admin_manager()
    or exists (
      select 1 from public.live_meetings m
      where m.id=target_meeting_id and m.host_id=(select auth.uid())
    );
$$;
revoke all on function private.can_manage_live_meeting(uuid) from public, anon;
grant execute on function private.can_manage_live_meeting(uuid) to authenticated;

drop policy if exists live_meetings_select on public.live_meetings;
drop policy if exists live_meetings_update on public.live_meetings;
drop policy if exists live_meetings_delete on public.live_meetings;
create policy live_meetings_select on public.live_meetings for select to authenticated
using (private.is_admin_manager() or host_id=(select auth.uid()) or private.is_live_meeting_member(id));
create policy live_meetings_update on public.live_meetings for update to authenticated
using (private.can_manage_live_meeting(id))
with check (private.can_manage_live_meeting(id));
create policy live_meetings_delete on public.live_meetings for delete to authenticated
using (private.can_manage_live_meeting(id));

drop policy if exists live_meeting_participants_select on public.live_meeting_participants;
drop policy if exists live_meeting_participants_insert on public.live_meeting_participants;
drop policy if exists live_meeting_participants_update on public.live_meeting_participants;
drop policy if exists live_meeting_participants_delete on public.live_meeting_participants;
create policy live_meeting_participants_select on public.live_meeting_participants for select to authenticated
using (private.is_admin_manager() or private.is_live_meeting_member(meeting_id));
create policy live_meeting_participants_insert on public.live_meeting_participants for insert to authenticated
with check (private.can_manage_live_meeting(meeting_id));
create policy live_meeting_participants_update on public.live_meeting_participants for update to authenticated
using (private.can_manage_live_meeting(meeting_id) or user_id=(select auth.uid()))
with check (private.can_manage_live_meeting(meeting_id) or user_id=(select auth.uid()));
create policy live_meeting_participants_delete on public.live_meeting_participants for delete to authenticated
using (private.can_manage_live_meeting(meeting_id));

drop policy if exists live_meeting_minutes_select on public.live_meeting_minutes;
drop policy if exists live_meeting_minutes_insert on public.live_meeting_minutes;
drop policy if exists live_meeting_minutes_update on public.live_meeting_minutes;
create policy live_meeting_minutes_select on public.live_meeting_minutes for select to authenticated
using (private.is_admin_manager() or private.is_live_meeting_member(meeting_id));
create policy live_meeting_minutes_insert on public.live_meeting_minutes for insert to authenticated
with check (private.can_manage_live_meeting(meeting_id) and created_by=(select auth.uid()) and updated_by=(select auth.uid()));
create policy live_meeting_minutes_update on public.live_meeting_minutes for update to authenticated
using (private.can_manage_live_meeting(meeting_id))
with check (private.can_manage_live_meeting(meeting_id) and updated_by=(select auth.uid()));

create or replace function private.can_manage_radio_channel(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select private.is_admin_manager()
    or exists (
      select 1 from public.safety_radio_channels c
      where c.id=target_channel_id and c.created_by=(select auth.uid())
    );
$$;
revoke all on function private.can_manage_radio_channel(uuid) from public, anon;
grant execute on function private.can_manage_radio_channel(uuid) to authenticated;

drop policy if exists safety_radio_channels_staff_all on public.safety_radio_channels;
create policy safety_radio_channels_select on public.safety_radio_channels for select to authenticated
using (
  private.is_staff()
  and (
    channel_type <> 'private'
    or created_by=(select auth.uid())
    or exists(select 1 from public.safety_radio_members m where m.channel_id=id and m.user_id=(select auth.uid()))
    or private.is_admin_manager()
  )
);
create policy safety_radio_channels_insert on public.safety_radio_channels for insert to authenticated
with check (private.is_staff() and created_by=(select auth.uid()));
create policy safety_radio_channels_update on public.safety_radio_channels for update to authenticated
using (private.can_manage_radio_channel(id))
with check (private.can_manage_radio_channel(id));
create policy safety_radio_channels_delete on public.safety_radio_channels for delete to authenticated
using (private.can_manage_radio_channel(id));

drop policy if exists safety_radio_members_staff_all on public.safety_radio_members;
create policy safety_radio_members_select on public.safety_radio_members for select to authenticated
using (
  user_id=(select auth.uid())
  or private.can_manage_radio_channel(channel_id)
  or exists(select 1 from public.safety_radio_channels c where c.id=channel_id and c.channel_type<>'private' and private.is_staff())
);
create policy safety_radio_members_insert on public.safety_radio_members for insert to authenticated
with check (private.can_manage_radio_channel(channel_id) and added_by=(select auth.uid()));
create policy safety_radio_members_delete on public.safety_radio_members for delete to authenticated
using (private.can_manage_radio_channel(channel_id));

drop policy if exists safety_radio_floor_leases_staff_all on public.safety_radio_floor_leases;
create policy safety_radio_floor_leases_select on public.safety_radio_floor_leases for select to authenticated
using (
  holder_id=(select auth.uid())
  or exists (
    select 1 from public.safety_radio_channels c
    left join public.safety_radio_members m on m.channel_id=c.id and m.user_id=(select auth.uid())
    where c.id=channel_id and c.is_active and private.is_staff()
      and (c.channel_type<>'private' or m.user_id is not null or c.created_by=(select auth.uid()) or private.is_admin_manager())
  )
);
revoke insert,update,delete on public.safety_radio_floor_leases from authenticated;

create or replace function public.radio_acquire_floor(p_channel_id uuid, p_ttl_seconds integer default 30)
returns public.safety_radio_floor_leases
language plpgsql
security definer
set search_path=public
as $$
declare result public.safety_radio_floor_leases;
begin
  if not private.is_staff() then
    raise exception 'Radio staff access required' using errcode='42501';
  end if;
  if not exists(
    select 1 from public.safety_radio_channels c
    left join public.safety_radio_members m on m.channel_id=c.id and m.user_id=auth.uid()
    where c.id=p_channel_id and c.is_active
      and (c.channel_type<>'private' or m.user_id is not null or c.created_by=auth.uid() or private.is_admin_manager())
  ) then
    raise exception 'Radio channel access denied' using errcode='42501';
  end if;
  delete from public.safety_radio_floor_leases where channel_id=p_channel_id and expires_at<now();
  begin
    insert into public.safety_radio_floor_leases(channel_id,holder_id,expires_at)
    values(p_channel_id,auth.uid(),now()+make_interval(secs=>least(greatest(p_ttl_seconds,10),120)))
    returning * into result;
  exception when unique_violation then
    raise exception 'Radio floor is already held' using errcode='P0001';
  end;
  return result;
end $$;

create or replace function public.radio_heartbeat_floor(p_channel_id uuid, p_ttl_seconds integer default 30)
returns public.safety_radio_floor_leases
language plpgsql
security definer
set search_path=public
as $$
declare result public.safety_radio_floor_leases;
begin
  if not private.is_staff() then raise exception 'Radio staff access required' using errcode='42501'; end if;
  update public.safety_radio_floor_leases
  set heartbeat_at=now(),expires_at=now()+make_interval(secs=>least(greatest(p_ttl_seconds,10),120))
  where channel_id=p_channel_id and holder_id=auth.uid() and expires_at>=now()
  returning * into result;
  if result.channel_id is null then raise exception 'Floor lease is not held' using errcode='P0001'; end if;
  return result;
end $$;

create or replace function public.radio_release_floor(p_channel_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if not private.is_staff() then raise exception 'Radio staff access required' using errcode='42501'; end if;
  delete from public.safety_radio_floor_leases where channel_id=p_channel_id and holder_id=auth.uid();
  return found;
end $$;

revoke all on function public.radio_acquire_floor(uuid,integer) from public,anon;
revoke all on function public.radio_heartbeat_floor(uuid,integer) from public,anon;
revoke all on function public.radio_release_floor(uuid) from public,anon;
grant execute on function public.radio_acquire_floor(uuid,integer) to authenticated;
grant execute on function public.radio_heartbeat_floor(uuid,integer) to authenticated;
grant execute on function public.radio_release_floor(uuid) to authenticated;
