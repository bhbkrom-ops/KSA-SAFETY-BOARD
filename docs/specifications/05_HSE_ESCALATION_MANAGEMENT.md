# KSA SAFETY BOARD — SECTION 05
## HSE ESCALATION MANAGEMENT

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

Routes:
- `/admin/escalations`
- `/admin/escalations/history`
- `/admin/escalations/matrix`

## Dashboard
Fields:
reference, title, source, severity, escalation level, responsible role/person, department, due date, status, acknowledgement/history.

Actions:
Create, Update Status, Resolve/Close, Delete permanently (authorized), refresh.

## History
Columns:
Date & Time, Escalation No, Source, Level, User, Action, Status, Details.

Controls:
Refresh, Search, Export CSV, Delete escalation+history if authorized.

## Matrix
Persist real rules in Supabase, not localStorage/demo defaults.

Fields:
reference, severity, timeline, level, responsible role, auto flag, active state.

Controls:
Create Rule, Edit, Save, Delete, enable/disable.

---
