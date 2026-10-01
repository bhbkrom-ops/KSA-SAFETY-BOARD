/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { cleanText } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

const resources = {
  permits: { table: "ptw_permits", fields: "id,reference_no,permit_type,title,description,location,risk_level,status,start_at,expiry_at,linked_loto_id,created_by,created_at,updated_at", prefix: "PTW" },
  loto: { table: "loto_records", fields: "id,reference_no,equipment_asset,energy_type,location,isolation_type,verification_method,tag_number,linked_ptw_id,status,start_at,end_at,created_by,created_at,updated_at", prefix: "LOTO" },
  inspections: { table: "inspection_tasks", fields: "id,reference_no,template_id,title,due_at,status,result,completed_at,created_by,created_at,updated_at", prefix: "INS" },
  audits: { table: "hse_audits", fields: "id,reference_no,title,standard,audit_type,status,plan_date,lead_auditor_id,created_by,created_at,updated_at", prefix: "AUD" },
  compliance: { table: "compliance_obligations", fields: "id,reference_no,title,requirement,authority,framework,clause,jurisdiction,source_url,applicability,status,criticality,effective_date,expiry_date,renewal_required,next_review_date,evidence_summary,gap_description,created_by,created_at,updated_at", prefix: "CMP" },
} as const;
type ResourceKey = keyof typeof resources;
const statusTransitions: Record<ResourceKey, Record<string, string[]>> = {
  permits: { draft: ["pending_review", "cancelled"], pending_review: ["pending_approval", "rejected"], pending_approval: ["approved", "rejected"], approved: ["active", "cancelled"], active: ["suspended", "expired", "closed"], suspended: ["active", "closed"], expired: ["closed"], rejected: ["draft"], closed: [], cancelled: [] },
  loto: { planned: ["active", "cancelled"], active: ["isolated", "cancelled"], isolated: ["verified", "cancelled"], verified: ["applied", "cancelled"], applied: ["released"], released: ["closed"], closed: [], cancelled: [] },
  inspections: { planned: ["in_progress", "overdue", "cancelled"], in_progress: ["completed", "fail", "pass"], completed: ["closed"], fail: ["closed"], pass: ["closed"], overdue: ["in_progress", "cancelled"], closed: [], cancelled: [] },
  audits: { planned: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"], completed: [], cancelled: [] },
  compliance: { under_review: ["compliant", "partially_compliant", "non_compliant"], compliant: ["under_review"], partially_compliant: ["compliant", "non_compliant", "under_review"], non_compliant: ["partially_compliant", "under_review"] },
};
function err(message: string, status = 422) { return Response.json({ ok: false, error: message }, { status }); }
function keyOf(value: string | null): ResourceKey | null { return value && value in resources ? value as ResourceKey : null; }
function ref(prefix: string) { return `${prefix}-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; }
const safe = (v: unknown, max = 500) => cleanText(v, max);

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  const key = keyOf(request.nextUrl.searchParams.get("resource")); if (!key) return err("resource must be permits, loto, inspections, audits, or compliance.", 400);
  const definition = resources[key]; const table = definition.table as string; const client = auth.client as unknown as { from: (table: string) => any }; const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 100), 1), 250); const status = safe(request.nextUrl.searchParams.get("status"), 40);
  let query = client.from(table).select(definition.fields).order("created_at", { ascending: false }).limit(limit); if (status) query = query.eq("status", status);
  const { data, error: dbError } = await query; if (dbError) return err(dbError.message, 500); return Response.json({ ok: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return err("HSE staff access is required.", 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null; const key = keyOf(safe(body?.resource, 30)); if (!key) return err("A valid work-control resource is required."); const d = resources[key]; const table = d.table as string; const client = auth.client as unknown as { from: (table: string) => any };
  const common = { created_by: auth.user.id } as Record<string, unknown>; let payload: Record<string, unknown>;
  if (key === "permits") { const title = safe(body?.title, 240), location = safe(body?.location, 180), permitType = safe(body?.permit_type, 40); if (!title || !location || !["hot_work","work_at_height","confined_space","electrical","excavation","lifting","general"].includes(permitType)) return err("Permit type, title, and location are required."); payload = { ...common, reference_no: ref(d.prefix), permit_type: permitType, title, description: safe(body?.description, 1000) || null, location, risk_level: ["low","medium","high","critical"].includes(safe(body?.risk_level, 20)) ? safe(body?.risk_level, 20) : "medium", hazards: Array.isArray(body?.hazards) ? body?.hazards : [], controls: Array.isArray(body?.controls) ? body?.controls : [], ppe: Array.isArray(body?.ppe) ? body?.ppe : [], start_at: safe(body?.start_at, 40) || null, expiry_at: safe(body?.expiry_at, 40) || null, status: "draft" }; }
  else if (key === "loto") { const equipment = safe(body?.equipment_asset, 180), energy = safe(body?.energy_type, 100), location = safe(body?.location, 180); if (!equipment || !energy || !location) return err("Equipment, energy type, and location are required."); payload = { ...common, reference_no: ref(d.prefix), equipment_asset: equipment, energy_type: energy, location, isolation_type: safe(body?.isolation_type, 80) || "lockout", verification_method: safe(body?.verification_method, 180) || "zero energy verification", tag_number: safe(body?.tag_number, 80) || null, start_at: safe(body?.start_at, 40) || null, end_at: safe(body?.end_at, 40) || null, status: "planned" }; }
  else if (key === "inspections") { const title = safe(body?.title, 240); if (!title) return err("Inspection task title is required."); payload = { ...common, reference_no: ref(d.prefix), title, template_id: safe(body?.template_id, 80) || null, due_at: safe(body?.due_at, 40) || null, status: "planned", result: {} }; }
  else if (key === "audits") { const title = safe(body?.title, 240), standard = safe(body?.standard, 40); if (!title || !["ISO 45001","ISO 14001","internal","legal"].includes(standard)) return err("Audit title and supported standard are required."); payload = { ...common, reference_no: ref(d.prefix), title, standard, audit_type: safe(body?.audit_type, 80) || "compliance", plan_date: safe(body?.plan_date, 20) || null, status: "planned" }; }
  else { const title = safe(body?.title, 240), requirement = safe(body?.requirement, 1200); if (!title || !requirement) return err("Compliance title and requirement are required."); payload = { ...common, reference_no: ref(d.prefix), title, requirement, authority: safe(body?.authority, 180) || null, framework: safe(body?.framework, 120) || null, clause: safe(body?.clause, 80) || null, jurisdiction: safe(body?.jurisdiction, 120) || null, source_url: safe(body?.source_url, 500) || null, applicability: "applicable", status: "under_review", criticality: ["low","medium","high","critical"].includes(safe(body?.criticality, 20)) ? safe(body?.criticality, 20) : "medium", expiry_date: safe(body?.expiry_date, 20) || null, next_review_date: safe(body?.next_review_date, 20) || null, evidence_summary: safe(body?.evidence_summary, 1000) || null, gap_description: safe(body?.gap_description, 1000) || null }; }
  const { data, error: dbError } = await client.from(table).insert(payload).select(d.fields).single(); if (dbError || !data) return err(dbError?.message ?? "Record could not be created."); await client.from("work_control_history").insert({ entity_type: key, entity_id: data.id, action: "created", new_status: payload.status, actor_id: auth.user.id }); return Response.json({ ok: true, data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return err("HSE staff access is required.", 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null; const key = keyOf(safe(body?.resource, 30)); const id = safe(body?.id, 80); const next = safe(body?.status, 40); if (!key || !id || !next) return err("Resource, ID, and next status are required."); const d = resources[key]; const table = d.table as string; const client = auth.client as unknown as { from: (table: string) => any }; const { data: previous } = await client.from(table).select("status").eq("id", id).single(); const allowed = statusTransitions[key][String(previous?.status)] ?? []; if (!allowed.includes(next)) return err(`Invalid transition from ${String(previous?.status)} to ${next}.`, 409); const { data, error: dbError } = await client.from(table).update({ status: next, updated_at: new Date().toISOString() }).eq("id", id).select(d.fields).single(); if (dbError || !data) return err(dbError?.message ?? "Status could not be updated."); await client.from("work_control_history").insert({ entity_type: key, entity_id: id, action: "status_updated", previous_status: previous?.status ?? null, new_status: next, actor_id: auth.user.id, details: { reason: safe(body?.reason, 500) || null } }); return Response.json({ ok: true, data });
}
