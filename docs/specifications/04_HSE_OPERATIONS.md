# KSA SAFETY BOARD — SECTION 04
## HSE OPERATIONS / عمليات الصحة والسلامة والبيئة

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

Build every branch below.

## HSE Safety Team `/admin/hse-team`
APIs:
- employee-directory type=hse
- monthly plan tasks
- employees

Fields:
name, employee ID, title, factory, HSE area, shift, email, phone, status.

Controls:
- Refresh
- Add HSE Staff
- Search
- Linked Account status
- Open Monthly Tasks
- Overdue Tasks

## Department Workforce Records `/admin/employees`
Fields:
name, employee ID, department, job title, factory, section, supervisor, email, phone, status, medical fitness, employee type, PPE, completed training.

Options:
- Fit
- Fit with Limitations
- Medical Review Due
- Active
- On Leave
- Terminated

Controls:
- Add/Edit employee
- Search/filter
- Preview profile
- QR/Passport
- Print Safety Passport
- Print Badge

## Data Import Center `/admin/import-center`
Import types:
- Employees
- Equipment
- Contractors
- Fire Devices
- Trainings

Accepted formats:
- XLSX
- CSV
- JSON

Controls:
- choose data type
- upload file
- validate
- preview first 20 rows
- display accepted/rejected rows
- Download XLSX Template
- Import
- limit source handling to current implemented constraints

API `/api/bulk-import`.

## Workforce Safety Violations `/admin/employee-violations`
Resources/APIs:
employee-directory workforce, violation templates, employee violations, escalations.

Severity:
Low / Medium / High / Critical.

Functions:
- Create violation
- choose employee
- choose violation template
- detect repeat violation
- Print
- Delete (authorized)
- Escalate
- create administrative escalation
- link escalation to violation

## Safety Observation Reports (SOR) `/admin/reports`
Functions:
- report register
- canonical public report link
- Copy Report Link
- Open Report Preview
- Print Safety Report
- escalation
- unified report
- export customization

Export:
- CSV
- Word
- JSON
- ZIP

Include field-selection/customization and unified summary printing.

## Safety Reporting `/admin/safety-reporting`
Reporter modes:
- Anonymous
- Confidential
- Identified

Case states:
New, Triage, Assigned, Investigation, Action Required, Closed.

Controls:
- view case
- update status
- permanent delete (authorized)
- load/send reporter messages
- reveal protected reporter identity only with privileged audited operation
- configure reporting channels
- Email / WhatsApp channel
- destination validation
- enable/disable channel

Use secure public intake/tracking controls with rate limit and encrypted identity handling.

## Mobile Field QR `/admin/mobile-field`
Features:
- QR lookup
- direct QR scan when browser supports
- manual QR entry fallback
- field safety observation
- severity/category
- camera/photo
- signed image upload
- GPS capture
- voice dictation Arabic/English
- online/offline state
- offline queue
- later sync
- save observation with image/location

## CAPA & Action Center `/admin/action-center`
Resources:
`hse_actions`, assignees, escalations, comments, evidence.

Statuses include:
Open, In Progress, Pending Verification, Completed, Closed, Blocked, Cancelled.

Priority:
Critical, High, Medium.

Controls:
- Create Action
- Edit
- Assign HSE employee
- Due date
- Comments
- Evidence
- History
- Escalations
- Verification/effectiveness
- Preview Action
- Print & Share

## HSE Workflow Center `/admin/workflow-center`
Sources:
Observation, Incident, NCR, Inspection, Risk.

States:
Open, In Progress, Pending Verification, Closed.

Controls:
- Create Workflow
- workflow title
- source type/reference
- link CAPA
- verification
- closure
- traceability register

## Management of Change (MOC) `/admin/management-of-change`
Lifecycle:
Draft → Screening → Risk Assessment → Approval → Implementation → Pre-Startup Review → Closed.
Also Rejected / Cancelled.

Mandatory MOC topics:
- risk assessment
- residual risk
- change controls
- training
- PTW
- LOTO
- documents
- environmental review
- PSSR

Resources:
`management_of_change`, `moc_reviews`, `moc_pssr_items`, `ptw_permits`, `loto_isolations`, `hse_actions`.

Include temporary change and expiry, reviews, PSSR checklist, linked PTW/LOTO, CAPA/actions.

## HSE Shift Handover `/admin/hse-shift-handover`
Resources:
handover, handover items, carry-forward function.

Fields:
shift name, area, incoming user, summary, key instructions, item type, details, priority, source type/id, owner, due date.

States:
Draft, Ready, Open, In Progress.

Controls:
- Refresh
- New Handover
- add item
- update item
- acknowledge/receive
- Carry Forward to next shift
- track overdue/high/critical items

## Automatic Monthly HSE Report `/admin/monthly-hse-report`
Snapshot metrics include:
- CAPA Created/Closed/Overdue
- Incidents
- NCR
- Violations
- Safety Observations
- Near Miss
- Inspections Completed/Failed
- PTW Issued
- Equipment Defects
- Fire Alarms
- Emergency Responses
- Training Records
- Critical Residual Risks

Controls:
- generate/request report
- select report/month/year
- review
- approve as governed
- Print & Share

Use monthly report RPCs and scheduled cron.

## Monthly HSE Work Plan `/admin/monthly-hse-plan`
Priorities:
Critical, High, Medium, Low.

Statuses:
Not Started, In Progress, Completed, Blocked, Escalated, Cancelled.

Categories:
Inspections, PTW/LOTO, Fire Safety, TBT/Training, Equipment Safety, Electrical Safety, Contractor Safety, Emergency, Environment, Documentation, General.

Fields:
title AR/EN, description, category, priority, assignee/backup, factory, department, start/due, linked record/module, notes, recurrence, evidence-required.

Controls:
- employee/assignee list
- tasks by month/year
- My / Team / All views
- evidence
- create task
- update task
- verify
- templates
- New Template
- Save Template
- Generate Monthly Plan from Templates
- monthly/weekly recurrence

## Incidents, Near Misses & RCA `/admin/incidents`
Types:
Near Miss, First Aid, Medical Treatment, Lost Time Injury, Property Damage, Environmental, Vehicle.

Severity:
Low, Medium, High, Critical.

Statuses:
Open, Under Investigation, Actions Pending, In Progress, Closed.

RCA:
- 5 Why
- Ishikawa categories: People, Machine/Equipment, Method/Process, Material, Environment, Measurement/Control
- immediate response
- evidence
- root/systemic cause
- CAPA
- lessons learned
- closure

Controls:
Create/Edit, Escalate, Preview Report, Print & Share.

## Safety Learning & Alerts `/admin/safety-learning`
Lifecycle:
Draft, Review, Approved, Published, Closed, Cancelled.

Source linkage:
Incident, NCR, MOC, Critical Control Verification.

Fields:
title, summary, lesson, category, severity, source, factory, area, root cause, immediate actions, preventive actions, key risks, expiry.

Recipients:
- assign recipient(s)
- required acknowledgement
- read
- acknowledge/comment
- overdue acknowledgement
- management decision
- effectiveness evaluation
- recurrence monitoring

Use safety-learning RPCs.

## Chemical & SDS Management `/admin/chemicals`
Resources:
chemicals, SDS, inventory transactions.

Fields:
product/manufacturer, CAS numbers, hazard classes, storage area, compatibility group, quantity/unit, max quantity, expiry, risk rating, PPE, spill response, first aid, disposal, notes.

SDS:
language, file URL, current/expired status.

Transactions:
Receive and inventory movement.

## Central Risk Register `/admin/risk-register`
Fields:
title, hazard, activity, department/factory/area, initial L/S, residual L/S, review date, notes.

Controls:
- Create risk
- automatic CAPA where required
- add control
- control hierarchy/type
- control owner/due date
- verify control
- effectiveness
- update residual risk
- prevent acceptance of critical residual risk
- require effective verified controls before accepting high residual risk

## Critical Control Verification `/admin/critical-controls`
Fields:
critical control selection, performance standard, verification frequency, next verification, method, result, evidence URL/findings.

Results:
Effective, Degraded, Failed.

Controls:
- Configure Critical Control
- Refresh
- record verification
- automatic CAPA on Degraded/Failed
- due/failed/degraded KPIs

## Process Safety Barrier Assurance `/admin/process-safety-barriers`
Lifecycle:
Draft, Review, Active, Closed, Cancelled.

Bowtie:
- hazard
- top event
- threats
- consequences
- preventive barriers
- mitigative barriers

Resources:
scenarios, barriers, impairments, risk register, risk controls, MOC, bowtie threats/consequences.

Barrier impairment:
Impaired status, expected restore date, compensating measures, action linkage.

## Industrial Hygiene & Exposure `/admin/industrial-hygiene`
Resources:
IH agents, SEGs, campaigns, measurements, occupational health requirements/surveillance, employees, contractor workers.

Agent:
category, unit, OEL value/unit/basis/source/effective date, comparison operator.

SEG:
department, factory, area, job titles, description.

Campaign:
agent, SEG, sampling method, provider, target sample count, dates.

Measurement:
sample type, measured value, sampled at, duration, location, instrument ref, findings, evidence.

Classification:
At or Above OEL, Outside Lower Limit, No OEL, Invalid.

Occupational health:
surveillance type, frequency/validity, employee/worker, requirement, due date.

## Risk Assessment 5×5 `/admin/risk-assessment`
Fields:
reference, activity/task, detailed location, department, identified hazard/risks, initial likelihood/severity/score, existing controls, additional controls, residual likelihood/severity/score, responsible owner, review date, status.

Risk bands:
High/Critical, Medium, Low.

Controls:
- register/table views
- Print Table
- Print Register
- Print Table as Image
- Print Risk Sheet
- Preview Sheet
- print-safe official template

## NCR `/admin/ncr`
Fields:
Reference No, Date, Department, Location, Severity, Status, Responsible Owner, Description of Non-Conformance, Immediate Action, Root Cause Analysis, Corrective Action, Due Date, Verification/Closure Notes, Evidence Photos.

Controls:
- New NCR
- list/filter/search
- open/edit
- save
- delete where authorized
- escalate
- upload/analyze where exposed
- Preview
- canonical standalone preview
- Print
- email draft after save when chosen
- Export Preview
- Export CSV / Word / JSON / ZIP

NCR template must be white, A4, bilingual, branded, with no nested board iframe.

## Safety Pyramid `/admin/safety-pyramid`
Levels:
- Fatality
- Lost-Time Injury (LTI)
- Restricted Work (RWD)
- Medical Treatment (MTC)
- First Aid (FAC)
- Near Miss
- At-Risk / Unsafe

Filters/options:
- month/year
- choose visible levels
- incident/NCR/observation-derived counts
- Print Report
- Print Pyramid Image
- print customization

---
