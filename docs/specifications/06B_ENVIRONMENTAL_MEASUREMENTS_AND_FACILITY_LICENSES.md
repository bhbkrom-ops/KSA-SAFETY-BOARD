# ENVIRONMENTAL MEASUREMENTS + FACILITY REGULATORY LICENSES

These are real routed modules that were underrepresented in the previous pack.

# Environmental Measurements
Route: `/admin/environmental-measurements`
API: `/api/environmental-measurements`
Table: `environmental_measurements`

Measurement types:
- Air Quality
- Noise
- Workplace Exposure
- Emissions
- Water
- Waste / Soil
- Other

Compliance states:
- PENDING
- COMPLIANT
- NON_COMPLIANT

Schedule indicators:
- NO DATE
- OVERDUE
- DUE SOON
- SCHEDULED

Fields include:
- factory
- contractor name
- measurement type
- parameter name
- measured value
- unit
- limit/reference where present
- compliance status
- measurement/due dates
- reminder enabled
- reminder days before
- notes

Actions:
- Create
- Edit
- Save
- Delete
- Filter
- reminder processing
- status highlighting

Backend automation:
`process_environmental_measurement_reminders`.

# Facility Regulatory Licenses
Route: `/admin/facility-regulatory-licenses`
API: `/api/facility-regulatory-licenses`
Table: `facility_regulatory_licenses`

License categories:
- Environmental License
- Civil Defense License
- Municipal License
- Industrial License
- Other Regulatory License

States:
- ACTIVE
- EXPIRING SOON
- EXPIRED
- PENDING RENEWAL

Fields:
- license number
- facility name
- facility code
- site name
- site address
- issuing authority
- issue date
- expiry date
- remarks
- renewal notes

Actions:
- Create
- Edit
- Save
- Delete
- All/category/status filtering
- expiry warnings
- renewal workflow/linkage

## Navigation audit
Both routes exist in `App.tsx` but are not currently exposed as primary sidebar items. Decide explicitly where they belong:
- Environmental Measurements → Environmental / HSE Operations or Compliance
- Facility Regulatory Licenses → Licenses / Compliance
Do not leave them accidentally hidden.
