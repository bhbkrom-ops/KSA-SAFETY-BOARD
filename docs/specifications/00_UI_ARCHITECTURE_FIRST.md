# KSA SAFETY BOARD — UI & SYSTEM ARCHITECTURE FIRST

نفّذ هذا الملف قبل جميع ملفات الأقسام.

## الهدف
ثبّت الهيكل العام، Design System، Navigation، Auth/RBAC، API conventions، print framework، mobile shell، loading/error/empty states قبل بناء تفاصيل الوحدات.

## 1. Application Shell
- Home landing page `/`
- Admin authentication `/admin/login`
- Protected admin shell `/admin/*`
- responsive Sidebar
- mobile drawer
- top bar
- global search
- notifications
- page title/icon
- quick access
- customizable sidebar ordering
- Arabic/English
- RTL/LTR
- dark/light application theme
- print templates always white
- fixed board identity: KSA SAFETY BOARD

## 2. Route Registry
Create a single route registry / traceability registry so every:
`sidebar item → route → lazy page component → permission → API/resource`
is known and testable.

Do not add a sidebar item unless its route exists.
Do not leave an active route without a deliberate visibility decision.

## 3. Design System
Standardize:
- OperationalHero
- KPI cards
- Card
- Tables
- Dialogs / Drawers
- Forms
- Inputs / Select / Textarea
- Badges
- Tabs
- Search
- Pagination where needed
- Toast feedback
- Loading skeletons
- Empty state
- Error state
- Destructive confirmation
- mobile field controls
- print/share modal

## 4. Auth and Security UI
Support:
- password login
- password policy check
- MFA verification
- sign out
- session refresh
- forced logout/session cutoff
- locked-login state/unlock administration
- least-privilege module permissions

## 5. Shared Data Layer
Use real Vercel API handlers and production Supabase.
No fake/demo fallback for production-backed modules.
Use React Query/query invalidation consistently.

## 6. Print System
Create one reusable print system for:
NCR, SOR, incidents, risk assessment, CAPA, fire, emergency drills, licenses, authorizations, training certificates, safety signs, assets, visitor badges, monthly reports, enterprise reports.

Requirements:
- A4/A3 when required
- white print canvas
- configurable board logo
- RTL/LTR
- no nested admin iframe
- preview/print/share
- clean pagination
- 300 DPI/high-quality export where required

## 7. Verification Gate
Before implementing business modules:
- all shell routes load
- sidebar/mobile navigation works
- auth redirect works
- RBAC hiding + server authorization model defined
- dark/light app modes do not alter print canvas
- mobile shell tested
- global search works
- no duplicated layout implementations
