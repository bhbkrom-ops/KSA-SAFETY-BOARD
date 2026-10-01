# KSA SAFETY BOARD — SECTION 14
## FINAL QUALITY GATE

**Verified source project:** `kromenzi/ksa-2026`  
**Vercel project:** `abdulkarem-board-2026`  
**Production Supabase project:** `sfdpkpqokazsegsstjfs`

> STANDALONE EXECUTION RULE  
> This file is a binding section-level specification. Before implementing, inspect the current repository and production schema for this section. Preserve every existing user-visible control, field, option, API/resource, DB relation, RPC, Edge Function, permission, print/export behavior and cross-module linkage. If the source contains additional behavior not explicitly written below, add it to the implementation and traceability matrix instead of removing it. No demo/localStorage replacement for production-backed features.

Before declaring any section complete, verify all of the following:

1. Every sidebar item has a real route.
2. Every route renders without blank screen or unhandled exception.
3. Every button has an implemented action.
4. Every action shows success/error feedback.
5. Every create/edit/delete persists after refresh.
6. Every destructive action requires confirmation.
7. Every permission check works server-side as well as UI-side.
8. Every list has loading, empty and error states.
9. Every filter/search works on real records.
10. Every print/preview works in light and dark application modes but prints on white.
11. Every template uses the current configured board logo.
12. No template renders the full admin shell recursively.
13. Every export produces valid data.
14. Every QR code resolves to a valid intended route/resource.
15. Every cross-module relationship opens its source record.
16. Every CAPA/escalation/workflow link is traceable.
17. Every KPI is calculated from real permission-scoped data.
18. Every notification/integration hides secrets.
19. RLS remains enabled on exposed production tables.
20. Public reporting cannot reveal reporter identity without privileged audited access.
21. Radio floor operations enforce channel membership and floor ownership.
22. Live meeting participant/minutes actions enforce membership/role rules.
23. MOC cannot close without its required reviews/PSSR workflow.
24. High/critical risks cannot be silently accepted contrary to control rules.
25. Safety Alert acknowledgement/effectiveness/recurrence are traceable.
26. Management Review snapshots are immutable/governed after capture as designed.
27. Monthly HSE reports are snapshot-based, reviewable, printable and cron-compatible.
28. Offline field observations reconcile cleanly on reconnect.
29. Mobile layout is usable for field operations.
30. Build/typecheck/tests pass before deployment.

---

# COPY-PASTE MASTER COMMAND FOR MANUS / CODEX

Use the entire document above as a binding functional specification for **KSA SAFETY BOARD**. Implement it section by section without deleting or simplifying existing features. First inspect the existing repository and production schema, create a traceability matrix of `sidebar item → route → page component → API/resource → database table/RPC/Edge Function → actions/buttons → print/template/export → permission`, then implement only after the traceability matrix has no unexplained gaps. For each module, preserve all existing user-visible labels and options, then improve reliability and UX without changing the business meaning. Any existing behavior found in source code that is not explicitly listed in this document must be preserved and added to the traceability matrix rather than removed. Do not use demo/localStorage records for production-backed modules. Finish each section with build/typecheck, CRUD persistence verification, RBAC/RLS verification, print/preview verification, mobile verification, and cross-module linkage tests.
