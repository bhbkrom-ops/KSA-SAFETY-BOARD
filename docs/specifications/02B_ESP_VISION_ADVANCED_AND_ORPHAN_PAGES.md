# ESP SAFETY VISION — ADVANCED PAGES AUDIT

The repository contains more Vision pages than the primary sidebar/router currently exposes.

## Active routed pages
- `/admin/vision/dashboard`
- `/admin/vision/live`
- `/admin/vision/cameras`
- `/admin/vision/devices`
- `/admin/vision/map`
- `/admin/vision/rules`
- `/admin/vision/events`
- `/admin/vision/alerts`
- `/admin/vision/analytics`
- `/admin/vision/settings`

## Existing source pages not currently routed in App.tsx
These must be audited before copying/removing:
- `vision/audit-log.tsx`
- `vision/equipment.tsx`
- `vision/fire-smoke.tsx`
- `vision/heatmap.tsx`
- `vision/people-vehicles.tsx`
- `vision/ppe.tsx`
- `vision/recordings.tsx`
- `vision/restricted-areas.tsx`

## Required decision
For each source page:
1. confirm whether it is a supported feature;
2. if supported, create route + sidebar/child navigation + permission;
3. if superseded by Dashboard/Events/Analytics, merge functionality and remove duplication only after parity verification.

## Functional details to preserve if activated

### AI Alerts Center
- severity filters: Critical/High/Medium/Low
- status filters: New/Acknowledged/Under Review/Resolved/False Positive
- confidence/human verification
- Acknowledge
- Resolve
- False Positive

### Vision Analytics
- violations by plant
- false-positive rate
- real-record-only analytics

### Vision Audit Log
- user
- action
- target device/object
- timestamp
- IP address

### Equipment Monitoring
- forklifts
- overhead cranes
- blocked emergency exits
- machine barriers
- people/equipment proximity

### Fire & Smoke
- active fire/smoke alerts
- thermal camera inventory
- online thermal camera count

### Heatmap
- event density by area
- highest density location
- PPE/restricted/equipment near-miss spatial aggregation

### People & Vehicle Analytics
- people events
- vehicle/forklift events
- proximity near misses

### PPE AI
Track:
- Helmet
- Vest
- Shoes
- Glasses
- Gloves
- Harness
Show category distribution based on real alerts.

### Recording Metadata
- search by camera
- recording metadata
- playback/export only when actual NVR/video integration exists

### Restricted Areas
- registered camera
- Polygon / Rectangle / Line Crossing
- severity Low/Medium/High/Critical
- persisted virtual zone
- interactive overlay drawer

## Tables / APIs
- vision_alerts
- vision_cameras
- vision_recordings
- vision_restricted_zones
- vision_audit_logs
- vision_settings
- vision_rules
- `/api/vision-alerts`
- `/api/vision-cameras`
- `/api/vision-recordings`
- `/api/vision-restricted-zones`
- `/api/vision-audit-logs`
- `/api/vision-settings`
