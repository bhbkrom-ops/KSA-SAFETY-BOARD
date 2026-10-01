-- Section 14: keep exposed RPC wrappers invoker-safe; move privileged implementation private.

create or replace function private.submit_public_report_internal(
  p_category text,
  p_priority text,
  p_exact_area text,
  p_description text
)
returns table(id uuid, reference_no text)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
  v_ref text;
  v_category public.report_category;
  v_priority public.priority_level;
begin
  if p_category not in ('unsafe_condition','unsafe_act','near_miss','positive_observation','environmental_observation') then
    raise exception 'Unsupported report category' using errcode='22023';
  end if;
  if p_priority not in ('low','medium','high','critical') then
    raise exception 'Unsupported priority' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_exact_area,''))) < 2 or char_length(p_exact_area) > 240 then
    raise exception 'A valid location is required' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_description,''))) < 10 or char_length(p_description) > 5000 then
    raise exception 'A valid report description is required' using errcode='22023';
  end if;

  v_category := p_category::public.report_category;
  v_priority := p_priority::public.priority_level;
  v_ref := 'PUB-' || to_char(current_date,'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  insert into public.reports(
    reference_no,category,status,priority,occurred_at,
    reporter_id,reporter_name,exact_area,description,is_public_submission
  ) values (
    v_ref,v_category,'submitted',v_priority,now(),
    null,null,btrim(p_exact_area),btrim(p_description),true
  )
  returning reports.id into v_id;

  insert into public.audit_logs(actor_id,event_type,entity_type,entity_id,new_data)
  values (null,'public_report.created','report',v_id,jsonb_build_object('reference_no',v_ref,'channel','web'));

  return query select v_id,v_ref;
end $$;

revoke all on function private.submit_public_report_internal(text,text,text,text) from public;
grant execute on function private.submit_public_report_internal(text,text,text,text) to anon, authenticated;

create or replace function public.submit_public_report(
  p_category text,
  p_priority text,
  p_exact_area text,
  p_description text
)
returns table(id uuid, reference_no text)
language sql
security invoker
set search_path=public,private
as $$
  select * from private.submit_public_report_internal(p_category,p_priority,p_exact_area,p_description);
$$;
revoke all on function public.submit_public_report(text,text,text,text) from public;
grant execute on function public.submit_public_report(text,text,text,text) to anon,authenticated;

create or replace function private.radio_acquire_floor_internal(p_channel_id uuid,p_ttl_seconds integer default 30)
returns public.safety_radio_floor_leases
language plpgsql
security definer
set search_path=public
as $$
declare result public.safety_radio_floor_leases;
begin
  if not private.is_staff() then raise exception 'Radio staff access required' using errcode='42501'; end if;
  if not exists(
    select 1 from public.safety_radio_channels c
    left join public.safety_radio_members m on m.channel_id=c.id and m.user_id=auth.uid()
    where c.id=p_channel_id and c.is_active
      and (c.channel_type<>'private' or m.user_id is not null or c.created_by=auth.uid() or private.is_admin_manager())
  ) then raise exception 'Radio channel access denied' using errcode='42501'; end if;
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

create or replace function private.radio_heartbeat_floor_internal(p_channel_id uuid,p_ttl_seconds integer default 30)
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

create or replace function private.radio_release_floor_internal(p_channel_id uuid)
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

revoke all on function private.radio_acquire_floor_internal(uuid,integer) from public;
revoke all on function private.radio_heartbeat_floor_internal(uuid,integer) from public;
revoke all on function private.radio_release_floor_internal(uuid) from public;
grant execute on function private.radio_acquire_floor_internal(uuid,integer) to authenticated;
grant execute on function private.radio_heartbeat_floor_internal(uuid,integer) to authenticated;
grant execute on function private.radio_release_floor_internal(uuid) to authenticated;

create or replace function public.radio_acquire_floor(p_channel_id uuid,p_ttl_seconds integer default 30)
returns public.safety_radio_floor_leases
language sql
security invoker
set search_path=public,private
as $$ select * from private.radio_acquire_floor_internal(p_channel_id,p_ttl_seconds); $$;

create or replace function public.radio_heartbeat_floor(p_channel_id uuid,p_ttl_seconds integer default 30)
returns public.safety_radio_floor_leases
language sql
security invoker
set search_path=public,private
as $$ select * from private.radio_heartbeat_floor_internal(p_channel_id,p_ttl_seconds); $$;

create or replace function public.radio_release_floor(p_channel_id uuid)
returns boolean
language sql
security invoker
set search_path=public,private
as $$ select private.radio_release_floor_internal(p_channel_id); $$;

revoke all on function public.radio_acquire_floor(uuid,integer) from public,anon;
revoke all on function public.radio_heartbeat_floor(uuid,integer) from public,anon;
revoke all on function public.radio_release_floor(uuid) from public,anon;
grant execute on function public.radio_acquire_floor(uuid,integer) to authenticated;
grant execute on function public.radio_heartbeat_floor(uuid,integer) to authenticated;
grant execute on function public.radio_release_floor(uuid) to authenticated;
