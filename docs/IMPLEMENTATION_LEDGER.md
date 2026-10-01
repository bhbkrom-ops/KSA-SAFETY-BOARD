
## 04 — HSE Operations / عمليات HSE

### Implemented

Added the HSE Operations command center and route family for HSE Safety Team, Workforce Records, Data Import Center, Workforce Violations, Safety Reporting Cases, Mobile Field QR boundary, CAPA & Action Center, HSE Workflow Center, Management of Change, Shift Handover, Monthly HSE Report, Monthly HSE Work Plan, Safety Learning, Chemicals & SDS, Central Risk Register, Critical Controls, Process Safety Barriers, Industrial Hygiene, Risk Assessment 5×5, and Safety Pyramid.

The shared command center provides protected branch navigation, real API loading, search, KPI summaries, loading/error/empty states, responsive tables, print-safe styling, employee creation, governed generic record creation for supported resources, and a dry-run import validation surface. Existing reports/actions/incidents/NCR/risk workflows remain owned by their existing register component; the new HSE Operations routes do not replace them.

### Database

Migration `0011_hse_operations_foundation.sql` was applied to Supabase. It adds `employee_directory`, `hse_monthly_plans`, `hse_monthly_plan_tasks`, `hse_operation_records`, and `hse_operation_events`, with indexes, foreign keys, lifecycle checks, staff-only RLS, and permission seeds. Generic records are intentionally used as a controlled integration boundary for module-specific payloads while dedicated module migrations are added in their respective sections.

### API

`/api/hse-operations` supports authenticated staff reads and CRUD for employee directory, monthly tasks, generic HSE resource records, and operation history. The endpoint validates resource names, statuses are persisted server-side, and create/update events are recorded. `/api/bulk-import` supports bounded JSON/CSV dry-run validation with maximum preview size and explicitly reports adapters not configured; it does not claim XLSX persistence.

### Verification

- `npm run lint` — PASS.
- `npm run build` — PASS; 30 routes compiled.
- All 20 HSE Operations routes — HTTP 200 through the production build.
- HSE Operations APIs without authentication — HTTP 401 with structured JSON.
- Supabase inventory — all five new HSE Operations tables present with RLS enabled; permissions increased from 26 to 30.
- Secret scan — no service-role keys, private keys, password assignments, or bearer tokens found.
- `git diff --check` — PASS.

### Explicit gaps

The current section is an operational foundation and route-complete integration boundary, not a claim that every specialist module has its final dedicated schema/UI. Dedicated PTW/LOTO, inspections, equipment, fire/emergency, training/licenses, contractor, MOC review/PSSR, IH OEL computation, file/SDS Storage, offline queue reconciliation, notification outbox, monthly report snapshot RPC/cron, safety-learning acknowledgement RPC, and authenticated browser CRUD/persistence tests remain pending in their dedicated sections. No fake records or fake connectivity were introduced.
