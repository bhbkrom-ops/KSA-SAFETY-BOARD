# KSA SAFETY BOARD — SECTION 06
## HSE COMPLIANCE & WORK CONTROL

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

## Permit, Compliance & Contractor Center `/admin/permit-compliance-center`
Central dashboard linking:
- PTW
- LOTO
- audits/findings
- contractors
- chemicals/SDS
- floor plans/map points

## Safety Inspections `/admin/inspections`
Resources:
templates, schedules, tasks, observations, HSE assignees.

Statuses:
Planned, In Progress, Completed, Overdue, Fail, Pass, Closed, Cancelled.

Controls:
- choose inspection template
- create schedule
- assign HSE employee
- frequency
- execute task
- create observation
- severity
- immediate action
- link CAPA
- close observation/task

## HSE Audits & ISO Compliance `/admin/audits`
Support ISO 45001 / ISO 14001.
Audit:
title, standard, type, plan/status.
Findings:
Major NC and other finding types, evidence, due date, action/CAPA, overdue tracking.

Controls:
Create Audit, register, findings, status, CAPA link.

## Compliance & Standards `/admin/compliance`
Legal/compliance obligation fields:
title, requirement, authority, framework, clause, obligation type, jurisdiction, source URL, department, factory, owner, applicability, status, criticality, effective/expiry date, renewal required/lead days, review dates, evidence summary/url, gap description.

Compliance:
Compliant, Partially Compliant, Non-Compliant.

## LOTO `/admin/loto`
Resources:
isolations, points, locks, employees, linked PTW.

Fields:
equipment/asset, energy type, location, normal/isolated state, verification method, tag number, lock owner, department/factory/area, isolation type, authorized employee, start/end.

Lifecycle:
Planned, Active, Isolated, Verified, Applied, Released, Closed, Cancelled.

Controls:
Create LOTO, add isolation point, verify point, add/remove lock, release, close.

## PTW `/admin/permits`
Permit types include hot work and support work-at-height/confined-space/electrical etc.

Fields:
title, description, department/factory/area/location, requester, start/expiry, risk level, hazards, controls, PPE, linked LOTO.

Lifecycle:
Draft, Pending Review, Pending Approval, Approved, Active, Suspended, Expired, Rejected, Closed, Cancelled.

Integrate:
- JSA (`job-safety-analyses`, `jsa-steps`)
- LMRA (`lmra-assessments`)
- LOTO

Actions:
Create, review, approve, activate, suspend, close, add JSA steps, acknowledge JSA, create LMRA, final pre-start control.

---
