-- Section 14: idempotent offline mobile-field reconciliation.
create unique index if not exists hse_safety_case_client_submission_uidx
on public.hse_operation_records ((payload->>'client_submission_id'))
where resource_type='safety_case' and nullif(payload->>'client_submission_id','') is not null;
