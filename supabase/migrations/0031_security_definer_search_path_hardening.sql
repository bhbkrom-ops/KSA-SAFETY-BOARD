-- Section 14 security hardening: pin SECURITY DEFINER search_path to empty.
-- All privileged function bodies use schema-qualified application objects.

alter function private.can_manage_live_meeting(uuid) set search_path to '';
alter function private.can_manage_radio_channel(uuid) set search_path to '';
alter function private.capture_hse_management_review_snapshot_internal(uuid,jsonb) set search_path to '';
alter function private.enforce_hse_operation_business_gates() set search_path to '';
alter function private.enforce_risk_approval_gate() set search_path to '';
alter function private.generate_monthly_hse_snapshot_internal(date,uuid) set search_path to '';
alter function private.handle_new_user() set search_path to '';
alter function private.hse_record_is_type(uuid,text[]) set search_path to '';
alter function private.is_admin_manager() set search_path to '';
alter function private.is_live_meeting_member(uuid) set search_path to '';
alter function private.is_staff() set search_path to '';
alter function private.live_meeting_audit_trigger() set search_path to '';
alter function private.overview_audit_trigger() set search_path to '';
alter function private.radio_acquire_floor_internal(uuid,integer) set search_path to '';
alter function private.radio_heartbeat_floor_internal(uuid,integer) set search_path to '';
alter function private.radio_release_floor_internal(uuid) set search_path to '';
alter function private.submit_public_report_internal(text,text,text,text) set search_path to '';
alter function private.vision_audit_trigger() set search_path to '';
