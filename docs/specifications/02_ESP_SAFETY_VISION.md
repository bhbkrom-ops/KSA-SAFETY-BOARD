# KSA SAFETY BOARD — SECTION 02
## ESP SAFETY VISION / رؤية السلامة الذكية

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

Build the entire **ESP Safety Vision** family:

- `/admin/vision/dashboard` — Vision Dashboard
- `/admin/vision/live` — Live Monitoring / Camera Wall
- `/admin/vision/cameras` — Camera Management
- `/admin/vision/devices` — Edge Devices (ESP)
- `/admin/vision/map` — Facility Camera Map
- `/admin/vision/rules` — Safety Rules
- `/admin/vision/events` — Safety Events
- `/admin/vision/alerts` — Alerts if exposed
- `/admin/vision/analytics` — Safety Analytics
- `/admin/vision/settings` — Vision Settings

## Vision Dashboard
KPIs:
- Total Cameras
- Online Cameras
- Offline Cameras
- Active Alerts
- PPE Alerts
- camera health

Shortcuts:
- Edge device health
- Camera Wall
- Factory Map
- Camera Directory
- Alerts Center

API:
- `/api/vision-cameras`
- `/api/vision-alerts`

## Live Monitoring / Camera Wall
Provide:
- responsive camera grid layouts
- All filter
- search by camera name/id/location
- online/warning/offline state
- recording indicator
- RTSP configured indicator
- resolution
- NVR/server information
- configured live preview only when streaming gateway exists

## Camera Management
Fields/options include:
- camera name
- camera ID
- plant/site
- zone/location
- IP address
- RTSP URL
- camera type (e.g. Fixed Bullet / PTZ)
- resolution
- firmware/version
- enabled/disabled
- online/offline/warning
- AI analytics configuration

Actions:
- Add Camera
- Edit
- Update
- Delete
- Enable/Disable
- View alerts
- configure AI analysis
- configure RTSP/NVR linkage

## ESP Edge Devices
Implement device discovery, health, provisioning/configuration, status, last-seen, connectivity and device-side ingestion through the `esp-devices` Edge Function/custom authentication model.

## Camera Map
Interactive factory/camera map:
- zoom
- camera position markers
- online/offline/warning visual state
- AI active indicator
- click camera to preview/configured feed
- location/site/IP/type details

## Safety Rules
Categories:
- PPE
- Restricted Zone
- Equipment
- Behavioral
- Fire/Smoke where applicable

Severity:
- Low
- Medium
- High
- Critical

Status:
- Active
- Inactive

Actions:
- Create
- Edit
- Toggle Active/Inactive
- Delete

API:
- `/api/vision-rules`

## Events / Analytics
Persist and analyze:
- PPE violations
- restricted-zone breaches
- equipment-related detections
- fire/smoke detections
- people/vehicle/proximity events where configured
- acknowledgement state
- severity
- timestamp
- camera/device/zone
- trend and distribution analytics

Database family:
`vision_devices`, `vision_cameras`, `vision_alerts`, `vision_recordings`, `vision_restricted_zones`, `vision_audit_logs`, `vision_settings`, `vision_rules`.

---
