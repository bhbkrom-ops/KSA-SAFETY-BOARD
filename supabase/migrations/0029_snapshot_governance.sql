-- Section 14: immutable management review capture + auditable monthly HSE snapshot generator.

revoke update on public.hse_management_reviews from authenticated;
grant update(title,period_start,period_end,status,chair_id,updated_by,updated_at) on public.hse_management_reviews to authenticated;

create or replace function private.capture_hse_management_review_snapshot_internal(p_review_id uuid,p_snapshot jsonb)
returns public.hse_management_reviews
language plpgsql
security definer
set search_path=public
as $$
declare result public.hse_management_reviews;
begin
  if not private.is_staff() then raise exception 'Management review snapshot requires HSE staff access' using errcode='42501'; end if;
  update public.hse_management_reviews
  set captured_snapshot=p_snapshot || jsonb_build_object('captured_at',now(),'captured_by',auth.uid(),'snapshot_version',1),
      captured_at=now(),updated_by=auth.uid(),updated_at=now()
  where id=p_review_id and captured_at is null
  returning * into result;
  if result.id is null then
    if exists(select 1 from public.hse_management_reviews where id=p_review_id and captured_at is not null)
      then raise exception 'Management review snapshot is immutable after capture' using errcode='23514';
    end if;
    raise exception 'Management review not found' using errcode='P0002';
  end if;
  return result;
end $$;
revoke all on function private.capture_hse_management_review_snapshot_internal(uuid,jsonb) from public;
grant execute on function private.capture_hse_management_review_snapshot_internal(uuid,jsonb) to authenticated;

create or replace function public.capture_hse_management_review_snapshot(p_review_id uuid,p_snapshot jsonb)
returns public.hse_management_reviews
language sql
security invoker
set search_path=public,private
as $$ select private.capture_hse_management_review_snapshot_internal(p_review_id,p_snapshot); $$;
revoke all on function public.capture_hse_management_review_snapshot(uuid,jsonb) from public,anon;
grant execute on function public.capture_hse_management_review_snapshot(uuid,jsonb) to authenticated;

create or replace function private.generate_monthly_hse_snapshot_internal(p_month_start date,p_site_id uuid default null)
returns public.safety_monthly_statistics
language plpgsql
security definer
set search_path=public
as $$
declare
  v_start date:=date_trunc('month',p_month_start)::date;
  v_end date:=(date_trunc('month',p_month_start)+interval '1 month')::date;
  v_id uuid;
  result public.safety_monthly_statistics;
  v_reports_total int; v_reports_open int; v_near_misses int; v_unsafe int; v_positive int;
  v_incidents_total int; v_recordable int; v_lti int; v_incidents_open int;
  v_actions_created int; v_actions_closed int; v_actions_overdue int; v_actions_open int;
  v_risks_review int; v_active_risks int; v_ncr_open int; v_ncr_closed int;
begin
  if p_site_id is not null then
    raise exception 'Site-scoped monthly snapshot requires action-to-site attribution and is not enabled' using errcode='0A000';
  end if;
  perform pg_advisory_xact_lock(hashtext('ksa-monthly-hse-'||v_start::text));

  select count(*) into v_reports_total from public.reports where created_at>=v_start and created_at<v_end;
  select count(*) into v_reports_open from public.reports where created_at<v_end and status<>'closed';
  select count(*) into v_near_misses from public.reports where created_at>=v_start and created_at<v_end and category='near_miss';
  select count(*) into v_unsafe from public.reports where created_at>=v_start and created_at<v_end and category='unsafe_condition';
  select count(*) into v_positive from public.reports where created_at>=v_start and created_at<v_end and category='positive_observation';

  select count(*) into v_incidents_total from public.incidents where occurred_at>=v_start and occurred_at<v_end;
  select count(*) into v_recordable from public.incidents
    where occurred_at>=v_start and occurred_at<v_end
      and lower(replace(incident_type,' ','_')) in ('medical_treatment','restricted_work_duty','lost_time_injury');
  select count(*) into v_lti from public.incidents
    where occurred_at>=v_start and occurred_at<v_end
      and lower(replace(incident_type,' ','_'))='lost_time_injury';
  select count(*) into v_incidents_open from public.incidents where occurred_at<v_end and status<>'closed';

  select count(*) into v_actions_created from public.actions where created_at>=v_start and created_at<v_end;
  select count(*) into v_actions_closed from public.actions where closed_at>=v_start and closed_at<v_end;
  select count(*) into v_actions_overdue from public.actions where due_date<v_end and status<>'closed';
  select count(*) into v_actions_open from public.actions where created_at<v_end and status<>'closed';

  select count(*) into v_risks_review from public.risk_assessments where status='review';
  select count(*) into v_active_risks from public.risk_assessments where status='active';
  select count(*) into v_ncr_open from public.ncr where created_at<v_end and status<>'closed';
  select count(*) into v_ncr_closed from public.ncr where closed_at>=v_start and closed_at<v_end;

  select id into v_id from public.safety_monthly_statistics
  where month_start=v_start and site_id is null
  for update;

  if v_id is null then
    insert into public.safety_monthly_statistics(
      month_start,site_id,reports_total,reports_open,near_misses,unsafe_conditions,positive_observations,
      incidents_total,recordable_incidents,lost_time_incidents,incidents_open,
      actions_created,actions_closed,actions_overdue,actions_open,
      risks_for_review,active_risks,ncr_open,ncr_closed,calculation_method,generated_by,generated_at
    ) values (
      v_start,null,v_reports_total,v_reports_open,v_near_misses,v_unsafe,v_positive,
      v_incidents_total,v_recordable,v_lti,v_incidents_open,
      v_actions_created,v_actions_closed,v_actions_overdue,v_actions_open,
      v_risks_review,v_active_risks,v_ncr_open,v_ncr_closed,'snapshot',auth.uid(),now()
    ) returning id into v_id;
  else
    update public.safety_monthly_statistics set
      reports_total=v_reports_total,reports_open=v_reports_open,near_misses=v_near_misses,
      unsafe_conditions=v_unsafe,positive_observations=v_positive,
      incidents_total=v_incidents_total,recordable_incidents=v_recordable,lost_time_incidents=v_lti,
      incidents_open=v_incidents_open,actions_created=v_actions_created,actions_closed=v_actions_closed,
      actions_overdue=v_actions_overdue,actions_open=v_actions_open,risks_for_review=v_risks_review,
      active_risks=v_active_risks,ncr_open=v_ncr_open,ncr_closed=v_ncr_closed,
      calculation_method='recalculated',generated_by=auth.uid(),generated_at=now()
    where id=v_id;
  end if;

  delete from public.safety_monthly_category_statistics where monthly_statistic_id=v_id;
  insert into public.safety_monthly_category_statistics(monthly_statistic_id,category,report_count,open_count,closed_count)
  select v_id,category,count(*)::int,
    count(*) filter(where status<>'closed')::int,
    count(*) filter(where status='closed')::int
  from public.reports
  where created_at>=v_start and created_at<v_end
  group by category;

  select * into result from public.safety_monthly_statistics where id=v_id;
  return result;
end $$;
revoke all on function private.generate_monthly_hse_snapshot_internal(date,uuid) from public;
grant execute on function private.generate_monthly_hse_snapshot_internal(date,uuid) to authenticated,service_role;

create or replace function public.generate_monthly_hse_snapshot(p_month_start date,p_site_id uuid default null)
returns public.safety_monthly_statistics
language sql
security invoker
set search_path=public,private
as $$ select private.generate_monthly_hse_snapshot_internal(p_month_start,p_site_id); $$;
revoke all on function public.generate_monthly_hse_snapshot(date,uuid) from public,anon;
grant execute on function public.generate_monthly_hse_snapshot(date,uuid) to authenticated,service_role;
