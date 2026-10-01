# KSA SAFETY BOARD — Implementation Ledger

## Current phase

**Phase 3 — ESP Safety Vision / camera and edge operations**

## Verified environment

- GitHub repository: `bhbkrom-ops/KSA-SAFETY-BOARD`
- Repository state at start: empty repository with no commits.
- Supabase target: `KSA SAFETY BOARD` / project ref `qazqzejfucknpmnkorqa`, status `ACTIVE_HEALTHY`.
- Supabase baseline: empty public schema before this phase.
- Vercel access: the available Vercel project is `abdulkarem-safety-board` and is linked to the older repository `abdulkarem-safety-board`, not yet to this empty target repository.
- Source baseline: transferred from the verified working vertical slice in `abdulkarem-safety-board`; no secrets were copied.

## Foundation decisions

1. Preserve the healthy Next.js + React + TypeScript + Supabase architecture rather than rebuilding from a generic template.
2. Treat the audited prompt pack under `docs/specifications/` as project requirements, while live repository/backend behavior remains the source of truth.
3. Use `src/lib/route-registry.ts` as the single active route/navigation/permission registry.
4. Keep planned modules out of active navigation until their route, API, database, permission, CRUD, print/export, mobile, and error/loading gates are implemented.
5. Keep the print surface independent from application dark-mode styling.
6. Treat the initial Supabase target as a new environment; do not mix its schema with the older `abdulkarem-safety-board` project.

## Changes in this phase

- Seeded the empty target repository with the existing working vertical slice.
- Copied the audited prompt pack into `docs/specifications/`.
- Added the route and traceability registry at `src/lib/route-registry.ts`.
- Wired the dynamic module route and application sidebar to the registry.
- Corrected the visible brand mark to `KSA SAFETY BOARD`.
- Applied the shared HSE foundation, security-hardening, and monthly HSE statistics migrations to the target Supabase project.
- Added the Live Collaboration schema migration with meetings, participants, messages, minutes, secure invite hash storage, audit triggers, RLS, and Supabase Realtime publication.
- Added authenticated Live Collaboration APIs for meeting CRUD/lifecycle, participant attendance, secure invite rotation, realtime messages, minutes, and linked HSE actions.
- Added `/admin/live-meeting` to the route registry and shell with responsive meeting register, lifecycle controls, attendance, minutes, action extraction, invite links, loading/error/empty states, and Realtime discussion.
- Added the ESP Safety Vision database family: `vision_devices`, `vision_cameras`, `vision_rules`, `vision_restricted_zones`, `vision_alerts`, `vision_recordings`, `vision_settings`, and `vision_audit_logs`.
- Added Vision permissions, RLS policies, indexes, audit triggers, and Realtime publication for cameras, devices, and alerts.
- Added Vision APIs for cameras, devices, alerts, rules, recordings, restricted zones, settings, and audit logs; camera responses never return raw RTSP endpoints.
- Added the nested Vision route family under `/admin/vision/[view]` with dashboard, camera wall, cameras, devices, map, rules, events, alerts, analytics, and settings views.
- Added truthful gateway states: the UI never presents RTSP as browser playback and shows preview unavailable unless a WebRTC/HLS gateway is configured.

## Acceptance gate for this phase

- [x] Active routes are represented in one registry.
- [x] Sidebar items map to active routes and permissions.
- [x] Dynamic module allow-list is derived from the registry.
- [x] Supabase foundation tables, RLS baseline, roles, permissions, and private authorization helper are applied.
- [x] Monthly HSE statistics tables and RLS policies are applied.
- [x] `npm run lint` passes with no warnings or errors.
- [x] `npm run build` passes and generates the expected Next.js routes.
- [x] Local production server returns HTTP 200 for `/api/health`, `/report`, and `/admin/dashboard`.
- [x] Push to `bhbkrom-ops/KSA-SAFETY-BOARD` verified on `main` at commit `fc39885`.
- [x] Live Collaboration tables exist in target Supabase with RLS enabled.
- [x] Live Collaboration APIs return `401` without a bearer session.
- [x] Realtime tables are published through the migration.
- [x] Live Collaboration route and all API handlers compile in production build.
- [x] Vision tables exist in target Supabase with RLS enabled.
- [x] Vision permissions, indexes, audit triggers, and Realtime publication are applied.
- [x] Vision API handlers and nested routes compile in production build.
- [x] Vercel project `krom5/ksa-safety-board` is linked to `bhbkrom-ops/KSA-SAFETY-BOARD`; Vision production deployment `dpl_AhF5pP5hCManS8ingiXgpDEVhGgF` verified READY at commit `55ce69c`.
- [x] Vision source scan found no RTSP credential, service-role key, device token, or private key in source/migrations.
- [ ] Authenticated route/session behavior verified in a real browser.
- [ ] Target Vercel project/repository linkage verified.
- [ ] Target deployment environment variables verified without exposing values.
- [ ] Full shell mobile/RTL/dark-mode visual verification completed.

## Status

**IMPLEMENTED — DEPLOYED, AUTHENTICATED ACCEPTANCE PENDING**

The repository foundation, Live Collaboration slice, and Vision slice are implemented in GitHub, Supabase, and the linked Vercel production deployment. Production readiness still requires authenticated browser CRUD/Realtime verification, actual ESP ingestion/stream gateway integration, storage/recording policies, and the remaining module gates.

## 02B — ESP Vision Advanced and Orphan Pages

### Orphan classification

All eight source-page capabilities were classified as **Supported / Activated**, not discarded:

- `/admin/vision/audit-log` → `vision_audit_logs` → `/api/vision-audit-logs`
- `/admin/vision/equipment` → persisted `vision_alerts` with `equipment` / `proximity` categories
- `/admin/vision/fire-smoke` → persisted `vision_alerts` with `fire_smoke` plus thermal-camera inventory
- `/admin/vision/heatmap` → persisted alert density grouped by camera/area
- `/admin/vision/people-vehicles` → persisted `people_vehicle` / `proximity` alerts
- `/admin/vision/ppe` → persisted PPE alerts and active PPE rules
- `/admin/vision/recordings` → `vision_recordings` → `/api/vision-recordings`
- `/admin/vision/restricted-areas` → `vision_restricted_zones` → `/api/vision-restricted-zones`

### Advanced governance

- Added model/detection/object/version, threshold, tracking, dedupe, verification, and HSE-link fields to `vision_alerts`.
- Added deduplication and tracking indexes.
- Added audit triggers for alert and settings changes with actor, action, target, before/after metadata, timestamp, and client IP where available.
- Added severity/status filters to the Alerts Center.
- Preserved truthful limitations: no metric proximity claim without calibration; no playback/export control when NVR/video integration is unavailable; no synthetic heatmap or AI events.

### Verification

- `npm run lint` — PASS.
- `npm run build` — PASS.
- Advanced routes `ppe`, `fire-smoke`, `equipment`, `people-vehicles`, `heatmap`, `recordings`, `restricted-areas`, and `audit-log` — HTTP 200 on the production build.
- All Vision APIs — HTTP 401 without authentication.
- Secret scan — no RTSP credentials, service-role keys, device tokens, or private keys found.

## 03 — Overview / نظرة عامة

### Implemented

The nine required branches are now routed through the authenticated Overview command center: dashboard, executive HSE, Safety Intelligence, Daily Operations Command, HSE Management Review, HSE Objectives, Environmental Aspects, Intelligence & Reporting Center, and the read-only HSE Assistant. The old limited dashboard renderer was replaced with the shared Overview surface while preserving the existing module register routes.

The implementation uses real permission-scoped APIs. `/api/data` serves dashboard, executive, daily-operations, and assistant resources; `/api/safety-intelligence` serves leading/lagging indicators and coverage; `/api/weather-current` returns an explicit not-configured state; management reviews, agenda items, objectives, progress updates, environmental aspects, and environmental monitoring have server-side CRUD endpoints.

### KPI integrity

Overview KPIs are calculated from bounded live queries over reports, actions, incidents, NCR, risk assessments/hazards, notifications, Vision alerts/devices, HSE objectives, environmental aspects/measurements, and management reviews. Leading and lagging indicators are separated, freshness is shown, drilldown links preserve source-module intent, and unavailable modules remain `null`/Not configured rather than fabricated zeroes.

### Database and governance

Migrations `0009_overview_management_objectives_environment.sql` and `0010_overview_snapshot_rpc.sql` were applied successfully. The target Supabase project now contains HSE management review/register item tables, HSE objectives/updates/action links, environmental aspects/monitoring tables, Overview permissions, RLS policies, indexes, audit triggers, and the governed `capture_hse_management_review_snapshot` RPC. All new tables report RLS enabled.

### Design / print / mobile

The Overview UI has a responsive operational layout, mobile stacking, horizontally scrollable subnavigation/tables, compact touch-oriented actions, explicit loading/error/empty states, and print CSS that removes application chrome and forces a white report canvas. Arabic/RTL-specific visual browser verification remains not tested in this sandbox; logical alignment and direction-safe spacing were used where applicable.

### Verification evidence

- `npm run lint` — PASS.
- `npm run build` — PASS; 28 static/dynamic routes compiled.
- Nine Overview routes — HTTP 200 on the production build.
- All Overview APIs tested without a bearer token — HTTP 401 with the expected JSON contract.
- Secret scan — no service-role keys, private keys, password assignments, or bearer tokens found.
- `git diff --check` — PASS.
- Supabase table inventory — all seven new Overview tables present with RLS enabled.

### Explicit gaps

PTW/LOTO, inspections, equipment, fire systems, contractor safety, industrial hygiene, MOC, critical controls, handovers, training, safety-alert acknowledgements, weather provider, monthly report generation, and notification automation are not configured in this target schema. Their Overview indicators remain explicit Not configured states. Browser-level authenticated CRUD persistence, desktop/tablet/mobile visual inspection, and Arabic RTL visual inspection are not tested in this sandbox because no authenticated browser session was available.
