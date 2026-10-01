# KSA SAFETY BOARD — SECTION 11
## ADMINISTRATION & SYSTEM

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

## Users & Roles `/admin/users`
Roles:
Admin, Manager, Editor, Viewer.

Granular module permissions at minimum:
Users, Incidents, NCR, Risk, Inspections, Training, Work Control/PTW-LOTO, Equipment, Fire Protection, Emergency, Reports, settings/integrations/live meeting/workflows/intelligence where configured.

Controls:
user create/edit/activate/deactivate, role assignment, permission matrix, security state/MFA-related visibility where implemented.

Use `admin-users` Edge Function for privileged user administration.

## Activity Log `/admin/activity`
Display:
Total Activities, Users, Modules, Today.
Table/log fields:
user, action, module, timestamp, metadata/details.
Control: Refresh.

## Facilities & Work Sites `/admin/plants`
Fields:
plant code, AR/EN name, manager, location, industry/type, status.
Statuses:
Active, Maintenance, Inactive.
Controls:
Add/Edit, validation, Preview Details, Print Directory, Print Plant Safety Profile.
Do not use demo plants in production final data.

## Integrations `/admin/integrations`
Providers:
- Email
- WhatsApp
- Teams
- In-App/Outbox

Controls:
Save securely, Test, Process queue, status Pending/Failed/Sent, configured/setup-required.
Never expose secrets in browser.

## System Readiness `/admin/system-readiness`
Check:
- system-health
- database readiness snapshot
- notification delivery
- notification cron
- monthly report cron
- In-App notifications
- Email/WhatsApp/Teams readiness
- live meeting
- authentication integrity
- MFA coverage
- privileged MFA readiness
- cron health for escalations/inspections/equipment/fire/reports/notifications

Controls:
Refresh, Process Notification Outbox where authorized.

## Settings `/admin/settings`
Enterprise settings include:
- fixed board identity
- company details
- board/company logo
- logo upload through signed branding storage
- plants
- departments
- document numbering/prefix rules
- QR configuration
- templates/PDF
- high-quality vector print / 300 DPI
- backup & restore module
- system health/diagnostics where exposed

Logo rules:
- do not persist Base64
- internal asset path or HTTPS only
- uploaded logo must propagate to templates

---
