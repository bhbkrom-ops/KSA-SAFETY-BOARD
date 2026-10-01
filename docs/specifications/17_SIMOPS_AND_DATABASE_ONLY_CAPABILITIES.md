# SIMOPS + DATABASE-ONLY CAPABILITY GAP

Production Supabase contains:
- `simops_plans`
- `simops_activities`
- `simops_conflict_rules`
- `simops_conflicts`

No corresponding active UI route or resource-map mapping was found in the current application audit.

## Required decision
Treat this as a real capability gap, not as an existing completed module.

If the business wants SIMOPS, build a proper module instead of exposing tables directly.

## Proposed SIMOPS module
Route suggestion:
`/admin/simops`

### SIMOPS Plan
- plan number
- title
- site/factory/area
- date/time window
- owner
- status
- linked PTW/MOC/JSA
- scope
- notes

### Activities
- activity
- contractor/department
- location
- start/end
- permit
- energy sources
- equipment
- critical controls

### Conflict Rules
Seed/govern formal rules for incompatible simultaneous activities.

Examples:
- hot work + flammable transfer
- lifting + pedestrian/public access
- energized electrical work + nearby intrusive work
- confined space + adjacent chemical/process operation

### Conflict Engine
- detect overlapping activity/time/location/rule
- severity
- rationale
- required controls
- owner
- acknowledgment
- resolution
- status
- evidence

### Links
- PTW
- JSA/LMRA
- LOTO
- MOC
- Critical Controls
- Contractor Safety
- HSE Actions

### Analytics
- open conflicts
- critical conflicts
- unresolved before shift/start
- conflict categories
- repeat conflicting activities

## Security
Add resource-map entries and RBAC only after defining ownership and RLS policy.
