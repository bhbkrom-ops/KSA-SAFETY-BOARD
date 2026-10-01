# FULL PROJECT GAP AUDIT — 2026-10-01

Scope reviewed:
- GitHub `kromenzi/ksa-2026`
- App routes
- Sidebar navigation
- Vercel rewrites / headers / cron
- Production Supabase `sfdpkpqokazsegsstjfs`
- public tables and RPC inventory
- current section prompt pack

## Confirmed additions required
1. UI/Architecture-first execution prompt.
2. Environmental Measurements.
3. Facility Regulatory Licenses.
4. Competency route/module.
5. Public portal and authentication.
6. Inbound mail configuration/alias decision.
7. Advanced/orphan Vision pages audit.
8. SIMOPS database-only capability.
9. AI runtime/knowledge backend governance.
10. Explicit orphan/legacy/route audit.

## Confirmed legacy mismatch
Old Lessons Learned source/resource mapping targets tables absent in current production; the current supported family is Safety Learning.

## Navigation mismatches
Active routes not present as primary sidebar entries include:
- inbound-config
- competency
- facility-regulatory-licenses
- environmental-measurements
- vision alerts
- vision settings

Utility/dynamic routes are intentionally excluded from sidebar.

## Database observation
All currently enumerated production public tables reported RLS enabled.
However, table existence + RLS does not automatically prove correct authorization. Policies/grants must still be tested per role.

## Build/release caution
A full rebuild prompt must not infer completion from file existence. Validate route, API, table, permission, persistence, print and deployment behavior.

## Definition of complete
A module is complete only when:
- route exists
- navigation visibility is intentional
- permission exists
- API exists
- DB ownership exists
- CRUD works after refresh
- error/loading/empty states exist
- cross-links work
- print/export works if applicable
- mobile behavior verified
- build/typecheck/test pass
