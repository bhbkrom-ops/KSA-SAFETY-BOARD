# KSA SAFETY BOARD — Section 13 Traceability Matrix

This matrix documents the current production-equivalent model in **bhbkrom-ops/KSA-SAFETY-BOARD** and Supabase project **qazqzejfucknpmnkorqa**. It intentionally preserves the current top-level `hse_operation_records` architecture and adds relational child tables where traceability requires normalized relationships.

| Domain | Parent / source | Relational detail | Cross-module target | Evidence / history |
|---|---|---|---|---|
| CAPA / Action | `actions` | `action_comments`, `action_evidence`, `action_escalations` | `hse_record_links`, `escalations` | `action_history`, `audit_logs` |
| Workflow | `hse_operation_records(resource_type=workflow)` | `hse_workflow_links` | source entity + CAPA via generic links | `hse_workflow_events` |
| JSA | `job_safety_analyses` | `jsa_steps` | PTW / LMRA through source identifiers | `jsa_acknowledgements` |
| MOC | `hse_operation_records(resource_type=management_of_change)` | `moc_reviews`, `moc_pssr_items` | actions, PTW, LOTO and other sources through `hse_record_links` | operation events + audit |
| Critical Controls | `hse_operation_records(resource_type=critical_control)` | `critical_control_verifications` | optional `actions` link | operation events + audit |
| Safety Learning | `hse_operation_records(resource_type=safety_learning)` | `safety_learning_recipients` | profiles / source entities | `safety_learning_notice_log`, `safety_learning_decisions` |
| Shift Handover | `hse_operation_records(resource_type=shift_handover)` | `hse_shift_handover_items` | employee owner + source record + carry-forward handover | operation events + audit |
| Process Safety | scenario/barrier records in `hse_operation_records` | `bowtie_threats`, `bowtie_consequences`, `process_safety_barrier_links` | risk links + actions | `process_safety_barrier_impairments` |
| Occupational Health | requirement record + `employee_directory` | `occupational_health_surveillance` | attachments | audit |
| Equipment | `equipment_passports` / `safety_assets` | `equipment_service_records`, `equipment_operator_authorizations` | employee + equipment authorization | attachments + audit |
| Contractor | `contractors` | `contractor_scorecards` | reviewer profile | audit |
| Fire | equipment/devices/panels/sites | inspection, pump, alarm, maintenance records | profiles | audit |
| Radio | `safety_radio_channels` + members/floor leases | `safety_radio_transmissions` | user/profile | append-only transmission history |
| Generic linkage | any supported entity | `hse_record_links` | any supported entity | `audit_logs` |

## API contract

`/api/traceability` is the governed interface for normalized relationship records.

- GET supports whitelisted resources and whitelisted filters only.
- POST/PATCH/DELETE require authenticated HSE staff.
- Append-only/system-generated resources cannot be edited or deleted.
- Occupational-health surveillance mutation requires `super_admin` or `hse_manager`.
- All mutation calls write to `audit_logs`.
- No table name can be supplied directly by the client.
- All database tables remain protected by Supabase RLS.

## Integrity rules

- MOC child rows must reference a top-level record with `resource_type=management_of_change`.
- Critical-control verification must reference `resource_type=critical_control`.
- Safety-learning recipients/notices/decisions must reference `resource_type=safety_learning`.
- Handover items and carry-forward targets must reference `resource_type=shift_handover`.
- Workflow links/events must reference `resource_type=workflow`.
- Bowtie threats/consequences must reference `resource_type=process_safety_scenario`.
- Barrier links/impairments must reference `resource_type=process_safety_barrier`.
- Action evidence must carry either an attachment or an evidence URL.
- Equipment service/operator records must reference at least an equipment passport or safety asset.
- Fire inspection/maintenance records must reference at least fire equipment or a fire device.

## Compatibility rule

Do not recreate old-project tables merely to match legacy names. Where the current production architecture uses `hse_operation_records` for the parent record, preserve it and normalize only the child relationship that requires relational integrity.
