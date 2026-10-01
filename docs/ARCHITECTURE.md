# Architecture report — KSA SAFETY BOARD

## Trust boundaries

Browser UI → Next.js route/rendering boundary → Supabase Auth/PostgREST/Storage. Public reporting has a dedicated anonymous insert policy. Staff reads/writes require an authenticated profile with a staff role and are additionally protected by RLS.

## Shared domain source of truth

Profiles, roles, permissions, sites, departments, work areas, attachments, actions, notifications, approvals/comments, settings, and audit logs are shared entities. Module records reference them rather than copying people, locations, or actions.

## Initial vertical slice

- Public report submission: category, risk, location, description, public flag, RLS insert-only rule.
- Staff registers: reports, actions, risk, incidents, NCR/CAPA visual shells with clear preview boundary.
- Dashboard: exception-first information hierarchy with adapter/not-connected states and click-through navigation.
- Branding: centralized product name token and reusable BrandMark.
- Localization: English LTR and Arabic RTL path in public reporting; logical layout rules are structured for later full dictionary extraction.
- Print: global print stylesheet removes dark UI chrome and keeps tables/headers light.

## Workflow rules

Status fields are Postgres enums rather than free text. Future transition endpoints must implement source/target guards, permission checks, required evidence/fields, audit events, and notifications in one transaction where writes are coupled.

## Deferred work

Authenticated login/session UX, register queries, server actions, attachment policies, rate limiting, complete module migrations, storage buckets, email notifications, weather provider credentials, and real WebRTC/PTT infrastructure are not claimed as complete by this checkpoint.
