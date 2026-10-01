# KSA SAFETY BOARD — SECTION 10
## SAFETY COMMUNICATION & CULTURE

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

## Safety Champions `/admin/gamification`
Show:
Points, Badges, Rank, Leaderboard.
No fake data; show Awaiting scoring data / Not enough data when empty.

## Departments `/admin/sections`
Fields:
department name/code and reporting linkage.
Controls:
New Department, Edit, Save, Delete.
Departments feed NCR/reports/forms.

## Safety Communications & Posts `/admin/posts`
Statuses:
Published, Draft, Archived.

Controls:
New Post, Edit, Publish/Draft/Archive, Delete, Search.

## Safety Radio PTT `/admin/safety-radio`
Channel types:
General, Private, Emergency/Public as configured.

Features:
- microphone permission
- push-to-talk floor acquisition
- heartbeat
- release floor
- WebRTC signaling
- Supabase Realtime broadcast/presence
- create channel
- add member
- user/member list
- public/private channel authorization
- current speaker/floor holder
- floor expiry
- mobile-friendly large PTT control

APIs:
`/api/radio?action=bootstrap|users|members|acquire-floor|heartbeat-floor|release-floor|create-channel|add-member`.

## HSE Inbox `/admin/inbound-inbox`
User/admin notification scope.
Controls:
All / Unread, Mark all read, mark read, delete, refresh.
Admin may view all notifications subject to permissions.

## Email Settings `/admin/email-settings`
Read-only secure provider readiness.
Do not enter/store SMTP passwords in browser.
Show:
Email Status, Ready/Not Ready, Required Variables, Secrets Storage = Vercel, Browser Passwords = Disabled, Configuration source.
Links to Integrations and System Readiness.

## HSE Alert Rules `/admin/notification-rules`
Fields:
rule name, event/type, severity, channel, recipient, active state.

Controls:
Create, Update, Activate/Deactivate, Delete.

---
