# KSA SAFETY BOARD — SECTION 01
## LIVE COLLABORATION / الاجتماعات المباشرة

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

Build the **Live Collaboration** section with route `/admin/live-meeting`.

## Live Meeting

Create a complete safety meeting system with meeting statuses:
- Scheduled
- Live
- Completed
- Cancelled

Access modes:
- Authenticated
- Invite-only

Core controls:
- Create meeting
- Start meeting
- Join meeting
- Secure invite link
- Copy invite link
- End/complete meeting
- Cancel meeting
- Refresh
- Participant attendance
- Host/participant roles
- Meeting minutes
- Actions generated from minutes
- Follow-up linkage to HSE actions

Backend/API:
- `/api/live-meetings`
- `/api/live-meeting-participants`
- `/api/live-meeting-invite`
- `/api/data?resource=live-meeting-minutes`
- `/api/data?resource=hse-actions`

Database:
- `live_meetings`
- `live_meeting_participants`
- `live_meeting_messages`
- `live_meeting_minutes`
- `hse_actions`

Meeting minutes must support controlled creation/update, action extraction/linkage, auditability, and restricted permissions.

---
