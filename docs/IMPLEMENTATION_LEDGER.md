# KSA SAFETY BOARD — Implementation Ledger

## Current phase

**Phase 1 — UI architecture and global system foundation**

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
- [ ] Authenticated route/session behavior verified in a real browser.
- [ ] Target Vercel project/repository linkage verified.
- [ ] Target deployment environment variables verified without exposing values.
- [ ] Full shell mobile/RTL/dark-mode visual verification completed.

## Status

**IMPLEMENTED — VERIFICATION IN PROGRESS**

The repository foundation and target database baseline are implemented in GitHub and Supabase. The system is not yet release-ready because target Vercel linkage, authenticated runtime, storage policies, and full module gates remain incomplete.
