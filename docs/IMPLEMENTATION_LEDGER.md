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
