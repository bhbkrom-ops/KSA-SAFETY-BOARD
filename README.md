# KSA SAFETY BOARD

Industrial HSE command center for safety reporting, risk, incidents, NCR/CAPA, and corrective actions.

## Current implementation

This repository contains the first production-oriented vertical slice and the architecture-first foundation for the audited KSA Safety Board prompt pack:

- `/admin/dashboard` — exception-first safety command center with weather adapter state, metric links, attention queue, and reporting trend.
- `/report` — Arabic/English public safety report form with client validation, upload boundary messaging, and Supabase persistence through the anonymous insert policy when configured.
- `/admin/reports` — safety reporting register shell.
- `/admin/actions` — central action tracker shell.
- `/admin/risk` — risk and JSA register shell.
- `/admin/incidents` — incident register shell with neutral RCA vocabulary.
- `/admin/ncr` — NCR/CAPA register shell.

The dashboard and registers show clearly labelled **preview fixtures** until authenticated operational queries are connected. They do not represent production metrics. Active route, navigation, and permission traceability is centralized in `src/lib/route-registry.ts`; the audited requirements are preserved under `docs/specifications/` and the phase ledger is `docs/IMPLEMENTATION_LEDGER.md`.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + custom design tokens
- Lucide icons
- Supabase PostgreSQL/Auth/Storage/RLS boundary
- Zod, React Hook Form, Recharts dependencies reserved for the next workflow slices

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The target Supabase project is `KSA SAFETY BOARD` (`qazqzejfucknpmnkorqa`). The foundation and security-hardening migrations are applied there. Do not place a service-role key in the browser or commit `.env.local`.

## Verification commands

```bash
npm run lint
npm run build
```

## Deployment contract

The project is configured as a server-backed Next.js container. `Dockerfile` performs a clean `npm ci`, builds Next.js in standalone mode, and starts the generated production server on the platform-provided `PORT`. The unauthenticated `/api/health` endpoint is the configured health probe. Publish configuration is stored in Webdev as `deploy.dockerfilePath = Dockerfile` and `deploy.healthPath = /api/health`; publishing remains an explicit owner action.

## Data and security foundation

The initial migration creates shared profiles, roles, permissions, departments, sites, buildings, work areas, reports, actions, incidents, NCR/CAPA, risk assessments/hazards, attachments, notifications, system settings, and audit logs. It adds lifecycle enums, indexes, profile creation on Supabase Auth signup, and RLS policies. Public reports are insert-only with `is_public_submission = true` and no `reporter_id`.

This is not a full production-ready claim. Authenticated runtime verification, target Vercel repository linkage, server-side module authorization tests, attachment storage policies, rate limiting, authenticated registers, and the remaining operational modules are pending vertical slices and must be verified before release.
