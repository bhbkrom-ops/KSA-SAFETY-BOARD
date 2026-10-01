-- Section 14: governed anonymous public safety report intake.

create or replace function public.submit_public_report(
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

revoke all on public.reports from anon;
grant execute on function public.submit_public_report(text,text,text,text) to anon, authenticated;
revoke all on function public.submit_public_report(text,text,text,text) from public;
