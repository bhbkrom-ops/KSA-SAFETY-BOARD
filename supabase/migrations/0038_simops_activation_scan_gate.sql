-- Section 17 hardening: SIMOPS plans cannot activate on stale/unperformed conflict analysis.
alter table public.simops_plans
  add column if not exists last_conflict_scan_at timestamptz,
  add column if not exists last_conflict_scan_by uuid references public.profiles(id) on delete set null;

create or replace function private.enforce_simops_plan_activation()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  activity_count integer;
  latest_activity_change timestamptz;
  latest_rule_change timestamptz;
  moc_type text;
begin
  if new.linked_moc_record_id is not null then
    select resource_type into moc_type from public.hse_operation_records where id=new.linked_moc_record_id;
    if moc_type is distinct from 'management_of_change' then
      raise exception 'SIMOPS MOC link must reference a Management of Change record' using errcode='23514';
    end if;
  end if;

  if new.status='active' and old.status is distinct from 'active' then
    select count(*),max(updated_at) into activity_count,latest_activity_change
    from public.simops_activities where plan_id=new.id and status<>'cancelled';

    select max(updated_at) into latest_rule_change
    from public.simops_conflict_rules where is_active=true;

    if activity_count >= 2 then
      if new.last_conflict_scan_at is null then
        raise exception 'SIMOPS conflict scan is required before activation' using errcode='23514';
      end if;
      if latest_activity_change is not null and latest_activity_change > new.last_conflict_scan_at then
        raise exception 'SIMOPS activities changed after the last conflict scan' using errcode='23514';
      end if;
      if latest_rule_change is not null and latest_rule_change > new.last_conflict_scan_at then
        raise exception 'SIMOPS conflict rules changed after the last conflict scan' using errcode='23514';
      end if;
    end if;

    if exists (
      select 1 from public.simops_conflicts c
      where c.plan_id=new.id
        and c.severity in ('high','critical')
        and c.status not in ('controlled','resolved','accepted')
    ) then
      raise exception 'SIMOPS plan cannot become active with unresolved high/critical conflicts' using errcode='23514';
    end if;
  end if;
  new.updated_at=now();
  return new;
end;
$$;
revoke all on function private.enforce_simops_plan_activation() from public,anon,authenticated;
