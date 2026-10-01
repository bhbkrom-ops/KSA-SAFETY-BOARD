
## 06 — HSE Compliance & Work Control / الامتثال والتحكم بالعمل

### Implemented

Activated the previously planned work-control navigation and added protected routes for `/admin/permit-compliance-center`, `/admin/permits`, `/admin/loto`, `/admin/inspections`, `/admin/audits`, and `/admin/compliance`. The shared Work Control command center provides operational register views, search, status filters, KPI summaries, create forms, lifecycle actions, CSV export, loading/error/empty states, responsive layout, and print-safe styling.

### Database

Migration `0013_hse_compliance_work_control.sql` was applied to Supabase. It adds `ptw_permits`, `loto_records`, `loto_isolation_points`, `loto_locks`, `job_safety_analyses`, `lmra_assessments`, `inspection_templates`, `inspection_tasks`, `inspection_observations`, `hse_audits`, `hse_audit_findings`, `compliance_obligations`, and `work_control_history`. Constraints cover supported permit types, HSE standards, lifecycle states, risk/severity, compliance status, and LOTO states. Indexes cover permit expiry, LOTO end dates, inspection due dates, audit finding due dates, compliance review/expiry, and history lookup. Staff-only RLS is enabled on every table. Permissions increased to 38 and include work-control, PTW, LOTO, inspection, and compliance management permissions.

### API and workflow

`/api/work-control` provides permission-scoped reads and staff-only creates/status transitions for permits, LOTO, inspections, audits, and compliance. Server-side transition maps reject invalid lifecycle transitions with HTTP 409. Created records write a history event; status changes record previous/new status, actor, and reason. The API validates trust-boundary fields and returns structured JSON. PTW, JSA, LMRA, LOTO, inspections, audits, and compliance share real persisted entities rather than localStorage or demo records.

### Verification

- `npm run lint` — PASS.
- `npm run build` — PASS; 32 routes compiled including `/api/work-control`.
- All six Section 06 routes — HTTP 200 through the production server.
- All five work-control resource reads without authentication — HTTP 401 structured JSON.
- Unauthenticated create attempt — HTTP 401 structured JSON.
- Supabase verification — 13 new tables exist with RLS enabled.
- Secret scan — no service-role keys, private keys, passwords, or bearer tokens found.
- `git diff --check` — PASS.

### Explicit gaps

Authenticated browser CRUD, role-specific 403 tests, persisted reload tests, nested JSA steps/acknowledgements, LOTO point/lock sub-resource APIs, inspection observation/CAPA creation, audit finding CRUD, and print templates for formal permits/audits remain follow-up work. The current slice establishes the governed core and the primary lifecycle surfaces without pretending those detailed sub-workflows are complete. No permit activation, isolation release, or compliance closure is automated without an authorized user.
