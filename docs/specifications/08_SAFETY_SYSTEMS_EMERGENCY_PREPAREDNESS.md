# KSA SAFETY BOARD — SECTION 08
## SAFETY SYSTEMS & EMERGENCY PREPAREDNESS

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

## Life Safety Operations `/admin/life-safety-operations`
Unified live data from:
fire gateways, panels, devices, exits, emergency responses, equipment, floor plans, map points, QR registry.

Expose shortcuts to Fire & Emergency, Muster, Safety Map, Equipment Safety, Mobile Field QR.

## Equipment Safety Passport `/admin/equipment-safety`
Per asset:
name, type, serial, manufacturer, model, department, factory, area, risk rating, certificate number/expiry, next inspection, next maintenance, operator authorization required, LOTO required, notes.

Related:
defects, service records, operator authorizations.

Controls:
Create asset, defect, service/inspection record, operator authorization, defect closure, QR/passport, certificate tracking.

## Safety Equipment & Assets `/admin/assets`
Fields:
asset tag, name, category, location, factory/department, last inspection, next due, status.

Controls:
Delete, Preview, Print Asset Register, QR Tag, Asset QR Tag print.

## Contractor Safety `/admin/contractor-safety`
Contractor fields:
registration, scope, contact, email/phone, contract dates, insurance expiry, status, notes.

Worker:
name, national ID, title, induction, medical, competency expiry.

Documents:
training certificates, issue/expiry, critical-for-access flag, file.

Scorecard/performance.

Status:
Approved, Conditional, Pending, Blocked, Suspended, Expired, Rejected.

## Visitor & Contractor Induction `/admin/visitors`
Fields:
badge, visitor name, company, national ID, host, induction status, check-in/out.

Controls:
Create/Edit/Delete, QR badge, Preview, Print, Print Register.

## Factory Safety Map `/admin/safety-map`
Floor plan:
name/building/floor/image/size.

Layers:
Fire Devices, Emergency Exits, First Aid, Spill Kit, Equipment, High Risk Zone, custom points.

Controls:
Create floor, select floor, add point, map X/Y, source linkage, status.

## Fire & Emergency Command `/admin/fire-emergency-command`
Resources:
gateways, panels, devices, device events, exits, exit events.

States include:
alarm, pre-alarm, supervisory, fault, offline, blocked, locked, inspection due, maintenance, normal.

Controls:
Create/update infrastructure, event monitoring, acknowledge/state actions, emergency drill/evacuation linkage.

## Emergency Response & Muster `/admin/emergency-response`
Resources:
responses, exits, assembly points, muster, timeline.

States:
Active, Missing, Accounted, All Clear, Closed, Cancelled.

Controls:
Update response, add timeline event, add muster person, update accounted/missing, All Clear.

## Emergency Preparedness & Drills `/admin/emergency`
Fields:
drill ref, type, scenario, location/factory, date, evacuation time, participants, assembly point, coordinator, safety officer, assessment, observations.

Controls:
Create/Edit/Delete, evaluation report, Print Register, Fire Drill Certificate.

## Fire Protection `/admin/fire-protection`
Equipment:
extinguisher and other fire assets with ID, serial, QR, category/type, manufacturer/model/capacity, zone/department/building, status.

Statuses:
good, inspection_due, maintenance_due, damaged, out_of_service, expired.

Functions:
Add equipment, inspect, pass/fail, pump/alarm/maintenance records, fire-health summary, QR, Print Report, Print QR Tag.

---
