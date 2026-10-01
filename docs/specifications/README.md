# IMPORTANT — UPDATED AFTER FULL PROJECT AUDIT

ابدأ بالترتيب:
1. `00_UI_ARCHITECTURE_FIRST.md`
2. `00_GLOBAL_SYSTEM_RULES.md`
3. ملفات الأقسام
4. ملفات B والإضافات الخاصة بالوحدات المخفية/الناقصة
5. `13_DATA_MODEL_CROSS_MODULE_RELATIONSHIPS.md`
6. `16_ORPHAN_LEGACY_AND_ROUTE_AUDIT.md`
7. `14_FINAL_QUALITY_GATE.md`

راجع `FULL_PROJECT_GAP_AUDIT.md` لمعرفة الفروقات المكتشفة بعد فحص GitHub/Vercel/Supabase.

# KSA SAFETY BOARD — SECTION PROMPT PACK

هذه الحزمة مقسمة بحيث يكون كل قسم رئيسي في ملف MD مستقل.

## ترتيب الاستخدام
1. اقرأ `00_GLOBAL_SYSTEM_RULES.md`.
2. استخدم ملف القسم المطلوب مستقلًا.
3. عند إعادة بناء النظام كاملًا، نفّذ الملفات بالترتيب الرقمي.
4. استخدم `13_DATA_MODEL_CROSS_MODULE_RELATIONSHIPS.md` للتحقق من العلاقات.
5. استخدم `14_FINAL_QUALITY_GATE.md` قبل اعتماد أي قسم.

## قاعدة عدم النسيان
أي سلوك موجود في الكود الحالي ولم يُذكر حرفيًا في ملف القسم لا يُحذف. يجب على المنفذ فحص:
- Sidebar item
- Route
- Page component
- API/resource
- Database table
- RPC / Edge Function
- Fields
- Buttons/actions
- Templates
- Preview/Print/Export
- Analytics/KPIs
- Permissions/RBAC/RLS
- Cross-module links
- Mobile/offline/realtime behavior

ثم إنشاء Traceability Matrix قبل التنفيذ.
