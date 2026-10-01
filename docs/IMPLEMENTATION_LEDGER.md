
## 05 — HSE Escalation Management / إدارة التصعيد

### Implemented

Added protected routes `/admin/escalations`, `/admin/escalations/history`, and `/admin/escalations/matrix` with a shared escalation command center. The dashboard supports search, severity filtering, KPI summaries, refresh, create, acknowledge, resolve, loading/empty/error states, and responsive/print-safe presentation. History supports search, refresh, and CSV export. Matrix supports real persisted rule creation and active rule display. A governed dry-run action evaluates active matching rules and explicitly reports that no write occurred.

### Database

Migration `0012_hse_escalation_management.sql` was applied to Supabase. It adds `escalation_rules`, `escalations`, `escalation_history`, and `notification_outbox`, with status/severity checks, source and due-date indexes, idempotency key support for outbox delivery, staff-only RLS, and four permissions: `escalations.read`, `escalations.manage`, `escalations.matrix.manage`, and `notifications.outbox.manage`. Supabase verification confirms all four tables exist with RLS enabled and permissions increased to 34.

### API and governance

`/api/escalations` provides authenticated reads for dashboard, history, matrix, and outbox views; staff-only create/update/delete; explicit status transitions; actor/status history; rule creation/update; and dry-run evaluation. Destructive deletion requires an explicit `confirm: true` payload. All responses use the structured `{ ok, data }` / `{ ok, error }` contract. No provider or channel secrets are exposed. The notification outbox schema is ready for a connected delivery worker, but no external email/WhatsApp/Teams sender was fabricated or enabled.

### Verification

- `npm run lint` — PASS with no warnings.
- `npm run build` — PASS; nested escalation route and API compiled.
- `/admin/escalations` — HTTP 200.
- `/admin/escalations/history` — HTTP 200.
- `/admin/escalations/matrix` — HTTP 200.
- Escalation GET views and POST dry-run without authentication — HTTP 401 with structured JSON.
- Supabase tables — four new tables verified with RLS enabled.
- Secret scan — no service-role keys, private keys, passwords, or bearer tokens found.
- `git diff --check` — PASS.

### Explicit gaps

The current section implements the governed management surface and persistence foundation. A production scheduler/worker that scans source modules, applies rules idempotently, claims outbox rows, delivers connected channels, retries transient failures, and records dead-letter outcomes remains pending for the automation/integration section. Authenticated browser CRUD persistence and role-specific 403 tests remain not tested because no authenticated test user/session was available in this run. No automatic closure or unreviewed CAPA creation was introduced.
