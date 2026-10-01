# KSA SAFETY BOARD — SECTION 03
## OVERVIEW / نظرة عامة

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

Build all Overview branches exactly:

1. `/admin/executive-hse`
2. `/admin/safety-intelligence`
3. `/admin/daily-operations-command`
4. `/admin/hse-management-review`
5. `/admin/hse-objectives`
6. `/admin/environmental-aspects`
7. `/admin/intelligence-reporting-center`
8. `/admin/hse-assistant`
9. `/admin/dashboard`

## Executive HSE Dashboard
Use `/api/data?resource=executive-hse` and executive snapshot logic.

Display:
- Overdue CAPA
- Critical CAPA
- Near Miss
- Active PTW
- Equipment Due
- Inspection Compliance
- Top 5 Residual Risks
- Critical fire-system Alarm/Fault
- Unsafe Emergency Exits
- Active Emergency Responses
- Blocked Contractors
- Chemical Issues
- Incidents
- NCR
- Contractors
- Chemicals

Every KPI must drill into its source module.

## Safety Intelligence
Use `/api/safety-intelligence`.

Indicators must include at minimum:
- Open Observations
- High/Critical Observations
- Incidents 30d
- Open NCR
- Overdue NCR
- Overdue CAPA
- Open High Risks
- Overdue Inspections
- Open Equipment Defects
- Fire Faults/Alarms
- Contractor Alerts
- Open MOC
- Overdue MOC
- High-Risk MOC
- MOC Awaiting PSSR
- Critical Controls Due
- Failed Critical Controls
- Degraded Critical Controls
- OEL Exceedances 30d
- Open IH Campaigns
- Measurements without OEL
- Invalid IH Units
- Published Safety Alerts
- Pending/Overdue Safety Alert Acknowledgement
- Safety Alert Ack %
- Safety Alerts pending effectiveness
- Open High/Critical Safety Alerts
- Recurrence after Safety Alert
- Handovers awaiting acknowledgement
- Open / High-Critical / Overdue handover items
- Open/In Review Management Reviews
- Open/Overdue Management Review actions
- Active / At Risk / Overdue / Achieved HSE Objectives
- Objective reviews due
- environmental/compliance/process-safety/occupational-health metrics where present in snapshot

## Daily Operations Command
Use `/api/data?resource=daily-operations-command`.

Must aggregate:
- fire
- risk
- PTW/LOTO
- industrial hygiene
- equipment
- incidents
- actions

Operational condition:
- Normal
- Elevated
- Critical

Controls:
- Refresh Now
- operational priority queue
- Primary / Follow-up
- Critical / High prioritization
- due date sorting
- click-through to source module

## HSE Management Review
Resources:
- `hse-management-reviews`
- `hse-management-review-items`
- `hse-management-review-capture-snapshot`
- `hse-actions`

Agenda topics include:
- Incidents & Near Misses
- Objectives & HSE KPIs
- Compliance & Audits
- CAPA Effectiveness
- Risk Register & Critical Controls
- Training & Competence
- Contractor Safety
- Emergency & Fire
- Industrial Hygiene & Exposure
- Management of Change
- Resources & Opportunities

Controls:
- Refresh
- New Review
- review register
- select review
- Create Draft
- update review
- capture KPI snapshot
- save agenda decisions
- priority
- action required
- owner
- due date
- evidence URL
- resource needs
- opportunities
- link/create action
- review/approval lifecycle

Use `capture_hse_management_review_snapshot`.

## HSE Objectives & Targets
Resources:
- `hse-objectives`
- `hse-objective-updates`
- `hse-objective-actions`
- `hse-management-reviews`
- `hse-actions`

Fields:
- description
- category
- department
- factory
- owner
- target value
- current value
- unit
- direction
- review frequency
- management review
- notes
- comment
- evidence URL

Statuses:
- Draft
- Active
- At Risk
- Achieved
- Closed
- Cancelled

Controls:
- Refresh
- New Objective
- record current value
- add progress update
- create Action Plan
- link Action Plan
- review history
- management-review linkage

## Environmental Aspects & Impacts
Resources:
- `environmental-aspects`
- `environmental-monitoring`

Fields:
- activity
- aspect
- impact
- category
- environmental medium
- operating condition
- factory
- area
- inherent severity/likelihood/frequency
- residual likelihood/frequency
- significance threshold
- operational controls
- owner
- review date
- evidence URL
- legal/compliance obligation reference
- monitoring unit
- reference limit/source
- location
- findings

Controls:
- Refresh
- New Environmental Aspect
- select aspect
- edit/update
- add monitoring record
- mark/track Significant
- obligation-linked indicator
- review overdue
- exceedance/incident status

## Intelligence & Reporting Center
Show:
- Early Warning Index
- active leading signals
- critical/elevated/watch/stable states
- source drilldown cards
- AI assistant shortcut
- Safety Intelligence shortcut
- Automated Monthly HSE Report shortcut

Make clear the index is rule-based operational pressure, not an ML incident probability.

## HSE Operational Assistant
Use `/api/data?resource=hse-assistant` and read-only `hse_data_assistant`.

Suggested prompts:
- overdue CAPA
- NCR/CAPA status
- top residual risks
- equipment needing attention
- PTW status
- fire/emergency exit status
- current HSE summary

Controls:
- question input
- Enter/send
- source-module link
- loading state
- explicit read-only notice

## Main Dashboard
Use:
- `/api/data?resource=dashboard-snapshot`
- `/api/weather-current`

Cards:
- Critical Actions
- Overdue Actions
- Open HSE Workflows
- Pending Verification
- Open Escalations
- Unread Notifications
- weather/wind cards where configured

Include:
- charts/tabs
- print dashboard report
- print-safe report
- drilldown
- language-specific weather labels

---
