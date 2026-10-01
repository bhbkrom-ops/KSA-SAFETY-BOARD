# KSA SAFETY BOARD — COMPLETE SECTION-BY-SECTION PROMPT PACK
## Source-aligned specification for the current board

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`  
**Architecture:** React + TypeScript + Vite + Tailwind + Recharts + Vercel Serverless APIs + Supabase PostgreSQL/Auth/Storage/Realtime/Edge Functions.

> IMPORTANT EXECUTION RULE FOR EVERY PROMPT BELOW  
> Rebuild the described module as a production-grade HSE module. Do not simplify, merge, rename, omit, or silently replace any field, button, menu item, action, status, filter, table, dialog, preview, print/export option, permission check, API linkage, database relation, RPC, scheduled process, notification path, template, QR feature, mobile behavior, analytics/KPI, audit event, or cross-module link described here. Preserve Arabic/English bilingual behavior and RTL/LTR. Use the existing board visual language and the fixed identity **KSA SAFETY BOARD**. Every create/update/delete/approve/verify/close/escalate action must use real persistence and authorization, never demo/localStorage unless explicitly stated as legacy behavior to be replaced.

---

# GLOBAL SYSTEM PROMPT — APPLY TO ALL SECTIONS

Build every module inside a unified enterprise HSE Management Information System with:

- Arabic/English UI, RTL/LTR, responsive desktop/tablet/mobile.
- RBAC using module/action permissions such as `read`, `create`, `update`, `delete`.
- Roles include at minimum Admin, Manager, Editor, Viewer plus granular module permissions.
- Authentication-protected `/admin/*` routes.
- Shared top bar, global search, notifications, current-page indicator, language switch, theme handling, collapsible sidebar, mobile drawer, quick access, and customizable menu order.
- Global printing rules: templates must remain white/print-safe regardless of dark mode.
- Global print/share experience: Preview, Print, Share where supported; prevent nested app iframe recursion.
- Branding source: company/board settings with safe logo storage; fallback board logo.
- Activity/audit logging for sensitive changes.
- No plaintext privileged secrets in browser/local storage/database.
- Supabase public tables must use RLS.
- Vercel API handlers must enforce server-side authorization.
- Storage uploads use signed upload/read workflows.
- Realtime only where required (meeting/PTT).
- Offline queue and field sync where specified.
- Cross-module CAPA, escalation, workflow, HSE event and notification linkage.
- Use stable API routes and real database data; no fake seeded records in production views.
- Analytics must be derived from actual records and permission-scoped.
- Common statuses must be visually differentiated with badges.
- All destructive actions require explicit confirmation.

## Shared backend services and RPCs to preserve

Use the current database/service concepts including:

`dashboard_snapshot`, `hse_executive_snapshot`, `hse_intelligence_snapshot`, `hse_system_readiness_snapshot`, `hse_data_assistant`, `employee_directory`, `monthly_hse_assignees`, `generate_monthly_hse_report`, `request_monthly_hse_report`, `request_monthly_hse_report_cron`, `run_hse_automation`, `scan_equipment_due_events`, `enqueue_hse_notification`, `process_in_app_notification_outbox`, `claim_notification_outbox`, `complete_notification_outbox`, `retry_notification_outbox`, `acknowledge_safety_learning_alert`, `read_safety_learning_alert`, `decide_safety_learning_alert`, `process_safety_learning_reminders`, `capture_hse_management_review_snapshot`, `carry_forward_hse_handover_item`, `radio_acquire_floor`, `radio_heartbeat_floor`, `radio_release_floor`, service-only radio floor wrappers, `is_admin_or_manager`, and login/session security RPCs.

Preserve active Supabase Edge Functions:

- `admin-users`
- `esp-devices`
- `local-safety-ai`
- `safety-reporting`
- `notification-integrations`

Scheduled automation:
- notification delivery cron
- monthly HSE report cron

---
