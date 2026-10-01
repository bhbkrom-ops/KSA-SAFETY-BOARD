# KSA SAFETY BOARD — SECTION 09
## HSE REPORTS & DOCUMENTS

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

## Documents & Records `/admin/files`
Signed storage workflow.
Fields:
title, category/type, status, file/url.

Controls:
Upload up to configured limit, save metadata, Preview/Open, Print, Delete, signed read.

## Safety Signs `/admin/reports-documents/safety-signs`
Categories:
Fire Safety, PPE, Electrical, Machinery, Traffic, Chemical, General.

Statuses:
Active, Draft, Under Review, Expired, Archived.

Sizes:
A4 portrait/landscape, A3 portrait/landscape, custom.

Features:
- bilingual sign text/instructions
- document number
- company/board branding
- QR
- preview
- selected-sign bulk print
- print count analytics
- Export Word
- Print Sign / PDF
- print-safe white templates

## Standardized HSE Reports `/admin/enterprise-reports`
Use unified report layout, high-resolution print, bilingual, real persisted records.

## Contracts `/admin/contracts`
Fields:
reference, title, vendor, dates, department, value/metadata/status.

Status:
Active, Expired, Pending.

Controls:
New Contract, Edit, Save, Delete, Search.

## Forms `/admin/forms`
Status:
Active, Draft, Archived.

Controls:
New Form, Edit, file/attachment, Preview, Print, Delete, filters.

## Invoices `/admin/invoices`
Status:
Paid, Unpaid, Overdue.

Controls:
New Invoice, Edit/Save, Delete, search/filter, due-date/status.

---
