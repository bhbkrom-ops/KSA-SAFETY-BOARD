# PUBLIC PORTAL + AUTHENTICATION

These public/system surfaces are part of the product and must be included in any full rebuild.

## Home `/`
Industrial landing page for KSA SAFETY BOARD.

Core navigation cards:
- Safety Management
- Work & Equipment
- Compliance & Audits
- Emergency & Protection

Requirements:
- configured industrial background
- board logo/name
- Arabic/English
- responsive layout
- links to admin modules
- public brand consistency

## Admin Login `/admin/login`
Flows:
- Login
- Signup if enabled
- Reset password
- Change password
- Password policy check
- MFA challenge
- session validation
- logout

APIs:
- `/api/auth/login?action=password-check`
- `/api/auth/login?action=signup`
- `/api/auth/login?action=reset`
- `/api/auth/login?action=change-password`
- `/api/auth/mfa?action=verify`
- `/api/auth/me`
- `/api/auth/logout`

Security:
- min password policy
- failed login tracking
- account lock
- session cutoff
- MFA for privileged accounts
- no open redirect in `next`
- safe error messages

## Public Safety Reporting `/report`
Languages currently include Arabic, English and Urdu.

Reporter identity modes:
- Anonymous
- Confidential
- Identified

Channels/source:
- WEB
- EMAIL
- WHATSAPP
- INTERNAL

Hazard categories include:
- Unsafe Condition
- Unsafe Act
- Near Miss
- Hazard
- Electrical
- Fire / Fire Protection
- Environmental
- Contractor Safety
- Equipment Safety
- Work at Height
- Confined Space
- preserve all additional current source categories

Public API:
- `safety-reporting-public?action=channels`
- `...action=upload-url`
- `...action=intake`

Must enforce:
- rate limit
- attachment proof/limits
- identity encryption
- no identity leakage
- tracking reference generation

## Public Tracking `/report/status`
Inputs:
- report reference
- private tracking code

Functions:
- load status
- view case information allowed for reporter
- reporter/HSE message thread
- send message

API:
- `safety-reporting-public?action=status`
- `...action=message`

## Public SOR `/report/:id`
Canonical standalone public report view.

## Public NCR `/ncr/:id`
Standalone printable NCR preview.

## 404
Provide correct Not Found handling for unknown SPA routes.
