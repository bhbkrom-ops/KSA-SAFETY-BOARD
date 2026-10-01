# ORPHAN / LEGACY / ROUTE AUDIT

Do not blindly copy every source file. Classify each as Active, Hidden, Alias, Legacy, or Orphan.

## Routes that exist but are not primary sidebar entries
- `/admin/inbound-config`
- `/admin/competency`
- `/admin/facility-regulatory-licenses`
- `/admin/environmental-measurements`
- `/admin/vision/alerts`
- `/admin/vision/settings`

Dynamic/utility routes intentionally should not be sidebar entries:
- `/admin/login`
- `/admin/ncr/new`
- `/admin/ncr/:id`
- `/admin/ncr/:id/preview`
- `/admin/safety-pyramid-print`
- `/admin/safety-signs` alias

## Source pages that exist but are not routed
Audit especially:
- `src/pages/admin/lessons-learned.tsx`
- Vision advanced pages listed in `02B_ESP_VISION_ADVANCED_AND_ORPHAN_PAGES.md`
- old NCR wrappers/pages not used by App router

## Critical database mismatch
`lessons-learned.tsx` / resource map references:
- `safety_lessons`
- `safety_lesson_acknowledgements`

The current production table inventory instead contains the newer:
- `safety_learning_alerts`
- `safety_learning_recipients`
- `safety_learning_notice_log`
- `safety_learning_decisions`

Therefore:
- do NOT recreate the old tables without migration rationale;
- migrate/merge any still-needed Lessons Learned UX into the current Safety Learning system;
- remove dead resource mappings only after confirming no production caller depends on them.

## Validation
Generate automated reports for:
1. Route with no sidebar visibility decision.
2. Sidebar href without route.
3. Lazy import not used by a route.
4. Source page not imported by App.
5. API rewrite with no caller.
6. Resource-map entry whose table does not exist.
7. Production table with no owner/module.
8. Migration-created table absent from docs.
