# KSA SAFETY BOARD — SECTION 12
## GLOBAL PRINTING, TEMPLATES, EXPORTS & BRANDING

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

Implement one shared print/export design system across the board.

## Shared rules
- Print canvas is always white.
- Dark mode must never make templates black.
- Board logo resolves from configuration with safe fallback.
- Prevent oversized logo; use consistent max dimensions.
- Use A4/A3 dimensions where applicable.
- Support Arabic/English and RTL/LTR.
- Avoid page clipping.
- Where requested, fit normal report data on one page while preserving readability.
- Hide interactive controls in print.
- Print dialogs must never render the entire app recursively.
- Use canonical standalone preview routes for NCR/SOR when applicable.
- Support 300-DPI/high-resolution visual output for standardized reports.

## Template families
- NCR
- Safety Observation Report
- Incident/RCA report
- Risk Assessment sheet/register/table image
- Safety Pyramid
- CAPA Action
- Fire Protection report/QR tag
- Emergency Drill report/certificate
- Equipment Authorization card
- Professional License card
- Safety Training certificate
- Asset QR/passport
- Visitor/Contractor QR badge
- Safety Signs
- Monthly HSE report
- Enterprise reports

## Export families
Where supported:
- CSV
- Word/DOC
- JSON
- ZIP
- PDF/Print
- Share/copy public link

---
