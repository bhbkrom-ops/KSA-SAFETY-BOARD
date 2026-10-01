# KSA SAFETY BOARD — SECTION 07
## LICENSES, COMPETENCY & AUTHORIZATIONS

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

## Licenses `/admin/licenses`
Types:
Driving, Forklift, Overhead Crane, Lifter/Manlift, MEWP, Heavy Vehicle, Other.

States:
VALID, EXPIRING SOON, EXPIRED, NO EXPIRY.

Controls:
Add/Edit/Delete, filter active/expiring, print professional license/card.

## Training `/admin/trainings`
Categories include Toolbox Talk and general HSE training.

Attendance:
Present, Absent, Excused.

Fields:
reference, title, category, trainer, factory/location, date/time, duration, attendance, objectives.

Controls:
Create/Edit/Delete, Print training record, issue Safety Training Certificate, participant selection/manual participant, Preview Certificate.

## Operational Authorizations `/admin/equipment-auth`
Categories:
- Forklift Operation
- Overhead Crane Operation
- Personnel Lift / Manlift
- MEWP
- Rigging & Banksman / Signalman
- Electrical Work Authorization
- LOTO Authorization
- Work at Height Authorization
- Confined Space Entry Authorization

Controls:
Create/Edit/Delete, status/expiry, Print authorization card/certificate.

## Training Matrix `/admin/training-matrix`
Courses include:
General HSE Induction, Fire Safety & Extinguisher, LOTO, Confined Space, First Aid & CPR, Working at Heights.

Status:
Completed, Pending, Expired.

Controls:
Add/update employee matrix row, course status, qualification/expiry, delete, print/report.

## Official Templates `/admin/official-templates`
Template types:
- Equipment Authorization Card
- Professional License Card
- Fire Drill Certificate
- Safety Training Certificate

Template controls:
- bilingual data
- board branding/logo
- personal photo (PNG/JPG/WebP, current size limit)
- card/license/certificate number
- holder/participant details
- Preview
- Print / PDF
- white print-safe output

## Authorization Reports `/admin/enterprise-reports`
Report datasets:
- Equipment Authorizations
- Licenses
- Training Records
- Training Matrix
- Competency Assessments

Produce standardized bilingual HSE reports with source data and print/share support.

---
