# COMPETENCY MANAGEMENT — EXISTING ROUTED MODULE

Route: `/admin/competency`
API family: `/api/competency`
Table: `competency`

The route exists but is not a current primary sidebar entry.

## Categories
- License
- Certification
- Medical
- Operator Authorization

## Status
- Valid
- Expiring Soon
- Expired

## Fields
- record/reference
- employee name
- employee ID
- department
- license/qualification name
- category
- issuer
- certificate number
- issue date
- expiry date
- status

## Features
- create competency/certification record
- edit/update
- expiry calculation
- QR if retained by current page
- certificate/profile preview
- print
- search/filter
- employee linkage
- relationship to Training Matrix, Licenses and Equipment Authorization

## Required architecture decision
Do not create a second competing competency model.
Either:
1. expose `/admin/competency` under Licenses, Competency & Authorizations; or
2. merge its functions into Training Matrix/Licenses and remove the orphan route only after data/feature parity verification.
