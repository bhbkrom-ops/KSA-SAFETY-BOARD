# Production Table Ownership Catalog

Section 16/17 authoritative ownership catalog for the production Supabase public schema.

- Production project: `qazqzejfucknpmnkorqa`
- Tables cataloged: **144**
- Ownership gaps: **0**
- SIMOPS is governed by the dedicated `simops_*` module tables.
- Legacy `safety_lessons` tables are intentionally not part of production; Safety Learning uses the current governed model.

## administration

- `audit_logs`
- `departments`
- `system_settings`

## analytics

- `safety_monthly_category_statistics`
- `safety_monthly_statistics`

## authentication

- `auth_security_events`
- `auth_security_state`
- `profiles`

## capa-action-center

- `action_comments`
- `action_escalations`
- `action_evidence`
- `action_history`
- `actions`
- `capa`

## compliance

- `compliance_obligations`
- `facility_regulatory_licenses`

## contractor-safety

- `contractor_documents`
- `contractor_scorecards`
- `contractor_workers`
- `contractors`

## critical-controls

- `critical_control_verifications`

## emergency-response

- `assembly_points`
- `emergency_drills`
- `emergency_exits`
- `emergency_muster`
- `emergency_responses`
- `emergency_timeline`

## environmental-compliance

- `environmental_aspects`
- `environmental_measurements`
- `environmental_monitoring_records`

## equipment-safety

- `equipment_authorizations`
- `equipment_operator_authorizations`
- `equipment_passports`
- `equipment_service_records`

## escalations

- `escalation_history`
- `escalation_rules`
- `escalations`

## facilities

- `buildings`
- `sites`
- `work_areas`

## fire-emergency

- `fire_alarm_records`
- `fire_devices`
- `fire_equipment`
- `fire_events`
- `fire_gateways`
- `fire_inspection_records`
- `fire_maintenance_records`
- `fire_panels`
- `fire_pump_records`

## hse-core

- `hse_audit_findings`
- `hse_audits`
- `hse_contracts`
- `hse_documents`
- `hse_forms`
- `hse_invoices`
- `hse_management_review_items`
- `hse_management_reviews`
- `hse_monthly_plan_tasks`
- `hse_monthly_plans`
- `hse_objective_actions`
- `hse_objective_updates`
- `hse_objectives`
- `hse_operation_events`
- `hse_operation_records`
- `hse_posts`
- `hse_record_links`
- `hse_report_exports`
- `hse_shift_handover_items`
- `hse_workflow_events`
- `hse_workflow_links`

## hse-operations

- `safety_learning_decisions`
- `safety_learning_notice_log`
- `safety_learning_recipients`

## incidents

- `incidents`

## industrial-hygiene

- `occupational_health_surveillance`

## inspections

- `inspection_observations`
- `inspection_tasks`
- `inspection_templates`

## licenses-competency

- `licenses`

## live-collaboration

- `live_meeting_messages`
- `live_meeting_minutes`
- `live_meeting_participants`
- `live_meetings`

## management-of-change

- `moc_pssr_items`
- `moc_reviews`

## ncr

- `ncr`

## notifications

- `notification_outbox`
- `notification_rules`
- `notifications`

## process-safety

- `bowtie_consequences`
- `bowtie_threats`
- `process_safety_barrier_impairments`
- `process_safety_barrier_links`

## public-reporting

- `public_report_access`
- `public_report_messages`
- `public_report_rate_limits`
- `report_attachments`

## rbac

- `permissions`
- `role_permissions`
- `roles`
- `user_roles`

## reports-documents

- `official_templates`
- `safety_signs`

## risk-management

- `risk_assessments`
- `risk_hazards`

## safety-assets

- `safety_assets`

## safety-communication

- `safety_radio_channels`
- `safety_radio_floor_leases`
- `safety_radio_members`
- `safety_radio_transmissions`

## safety-culture

- `gamification_awards`
- `gamification_badges`
- `gamification_points_ledger`

## safety-map

- `safety_map_points`
- `safety_maps`

## safety-reporting

- `reports`

## shared-records

- `attachments`

## simops

- `simops_activities`
- `simops_conflict_rules`
- `simops_conflicts`
- `simops_plans`

## training-competency

- `competency`
- `training_attendance`
- `training_matrix`
- `trainings`

## vision

- `vision_alerts`
- `vision_audit_logs`
- `vision_cameras`
- `vision_devices`
- `vision_recordings`
- `vision_restricted_zones`
- `vision_rules`
- `vision_settings`

## visitor-safety

- `visitors`

## work-control

- `job_safety_analyses`
- `jsa_acknowledgements`
- `jsa_steps`
- `lmra_assessments`
- `loto_isolation_points`
- `loto_locks`
- `loto_records`
- `ptw_permits`
- `work_control_history`

## workforce

- `employee_directory`

