-- Governed Overview snapshot capture
create or replace function public.capture_hse_management_review_snapshot(p_review_id uuid, p_snapshot jsonb)
returns public.hse_management_reviews
language plpgsql
security invoker
set search_path = public
as $$
declare result public.hse_management_reviews;
begin
  if not private.is_staff() then raise exception 'Management review snapshot requires HSE staff access'; end if;
  update public.hse_management_reviews
     set captured_snapshot = p_snapshot || jsonb_build_object('captured_at', now(), 'captured_by', auth.uid(), 'snapshot_version', 1),
         captured_at = now(),
         updated_by = auth.uid(),
         updated_at = now()
   where id = p_review_id
   returning * into result;
  if result.id is null then raise exception 'Management review not found'; end if;
  return result;
end;
$$;
grant execute on function public.capture_hse_management_review_snapshot(uuid, jsonb) to authenticated;
