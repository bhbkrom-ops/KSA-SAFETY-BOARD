# KSA SAFETY BOARD — SECTION 13
## DATA MODEL & CROSS-MODULE RELATIONSHIPS

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

Preserve these major production domains and relationships.

## Core identity/config
`users`, `permissions`, `departments`, `employees`, `sections`, `section_config`, `site_settings`, `plants`, `activity_logs`.

## Reporting/NCR
`reports`, `safety_reports`, `ncr`, `safety_observations`, `safety_signs`.

## Incident/CAPA/workflow/escalation
`incidents`, `hse_actions`, `hse_action_comments`, `hse_action_evidence`, `hse_action_history`, `hse_action_escalations`, `hse_escalation_rules`, `escalations`, `escalation_matrix`, `hse_events`, `hse_workflows`, `hse_workflow_links`, `hse_workflow_events`.

## Risk/work control
`risk_assessments`, `risk_register`, `risk_controls`, `permits`, `ptw_permits`, `loto`, `loto_isolations`, `loto_points`, `loto_locks`, `job_safety_analyses`, `jsa_steps`, `jsa_acknowledgements`, `lmra_assessments`.

## MOC / Critical Control / Process Safety
`management_of_change`, `moc_reviews`, `moc_pssr_items`, `critical_control_verifications`, `process_safety_scenarios`, `process_safety_barriers`, `process_safety_barrier_impairments`, `bowtie_threats`, `bowtie_consequences`.

## Industrial hygiene / occupational health
`ih_agents`, `ih_segs`, `ih_campaigns`, `ih_measurements`, `occupational_health_requirements`, `occupational_health_surveillance`.

## Learning / shift / management governance
`safety_learning_alerts`, `safety_learning_recipients`, `safety_learning_notice_log`, `safety_learning_decisions`, `hse_shift_handovers`, `hse_shift_handover_items`, `hse_management_reviews`, `hse_management_review_items`, `hse_objectives`, `hse_objective_updates`, `hse_objective_actions`.

## Environmental
`environmental_measurements`, `environmental_aspects`, `environmental_monitoring_records`.

## Inspections/equipment
`inspection_templates`, `inspection_schedules`, `inspection_tasks`, `inspections`, `equipment_assets`, `equipment_service_records`, `equipment_defects`, `equipment_operator_authorizations`, `assets`, `equipment_auth`.

## Fire/emergency
fire gateways/panels/devices/events/equipment/inspection/pump/alarm/maintenance/alerts, emergency exits/events/assembly points/response/timeline/muster.

## Contractor/people
`contractors`, `contractor_workers`, `contractor_documents`, `contractor_scorecards`, `visitors`.

## Training/license
`trainings`, `training_matrix`, `competency`, `licenses`, `facility_regulatory_licenses`.

## Communication
`notifications`, `notification_rules`, `notification_outbox`, provider settings, live meetings, radio channels/members/floor/transmissions.

## Vision
vision devices/cameras/alerts/recordings/restricted zones/audit logs/settings/rules.

---
