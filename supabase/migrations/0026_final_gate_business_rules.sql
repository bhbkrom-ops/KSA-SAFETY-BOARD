-- Section 14 business integrity gates: MOC, Risk, Safety Learning.

create or replace function private.enforce_hse_operation_business_gates()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  bad_count integer;
  total_count integer;
begin
  if new.resource_type='management_of_change'
     and new.status='closed'
     and old.status is distinct from 'closed' then
    select count(*) into total_count from public.moc_reviews where moc_record_id=new.id;
    if total_count=0 then
      raise exception 'MOC cannot close without required reviews' using errcode='23514';
    end if;
    select count(*) into bad_count
    from public.moc_reviews
    where moc_record_id=new.id and decision not in ('approved','approved_with_conditions');
    if bad_count>0 then
      raise exception 'MOC cannot close while reviews are pending or rejected' using errcode='23514';
    end if;

    select count(*) into total_count from public.moc_pssr_items where moc_record_id=new.id;
    if total_count=0 then
      raise exception 'MOC cannot close without PSSR verification items' using errcode='23514';
    end if;
    select count(*) into bad_count
    from public.moc_pssr_items
    where moc_record_id=new.id and status not in ('pass','not_applicable');
    if bad_count>0 then
      raise exception 'MOC cannot close until all PSSR items pass or are not applicable' using errcode='23514';
    end if;
  end if;

  if new.resource_type='safety_learning'
     and new.status in ('closed','completed')
     and old.status is distinct from new.status then
    select count(*) into bad_count
    from public.safety_learning_recipients
    where alert_record_id=new.id
      and acknowledgement_required
      and acknowledged_at is null;
    if bad_count>0 then
      raise exception 'Safety learning cannot close while required acknowledgements are pending' using errcode='23514';
    end if;

    select count(*) into bad_count
    from public.safety_learning_recipients
    where alert_record_id=new.id
      and acknowledgement_required
      and coalesce(effectiveness_status,'pending') in ('pending','ineffective');
    if bad_count>0 then
      raise exception 'Safety learning cannot close before effectiveness review is complete' using errcode='23514';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists hse_operation_business_gate on public.hse_operation_records;
create trigger hse_operation_business_gate
before update of status on public.hse_operation_records
for each row execute function private.enforce_hse_operation_business_gates();

create or replace function private.enforce_risk_approval_gate()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  high_count integer;
  uncontrolled_count integer;
begin
  if new.status in ('approved','active')
     and old.status is distinct from new.status then
    select count(*) into high_count
    from public.risk_hazards
    where assessment_id=new.id
      and residual_likelihood * residual_severity >= 15;

    if high_count>0 then
      if new.approved_by is null then
        raise exception 'High or critical residual risk requires an approver' using errcode='23514';
      end if;

      select count(*) into uncontrolled_count
      from public.risk_hazards
      where assessment_id=new.id
        and residual_likelihood * residual_severity >= 15
        and nullif(btrim(coalesce(additional_controls,'')),'') is null;
      if uncontrolled_count>0 then
        raise exception 'High or critical residual risk requires documented additional controls' using errcode='23514';
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists risk_approval_business_gate on public.risk_assessments;
create trigger risk_approval_business_gate
before update of status on public.risk_assessments
for each row execute function private.enforce_risk_approval_gate();

revoke all on function private.enforce_hse_operation_business_gates() from public,anon,authenticated;
revoke all on function private.enforce_risk_approval_gate() from public,anon,authenticated;
