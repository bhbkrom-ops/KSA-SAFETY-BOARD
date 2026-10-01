import { NextRequest } from "next/server";
import { cleanText } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

const escalationFields = "id,escalation_no,title,source_type,source_id,source_reference,severity,escalation_level,responsible_role,responsible_person_id,department_id,due_date,status,acknowledged_at,acknowledged_by,resolved_at,resolved_by,details,created_by,created_at,updated_at";
const ruleFields = "id,reference_no,source_type,severity,timeline_minutes,escalation_level,responsible_role,auto_flag,is_active,conditions,created_by,updated_by,created_at,updated_at";
const severities = ["low", "medium", "high", "critical"];
const statuses = ["open", "acknowledged", "in_progress", "resolved", "closed", "cancelled"];
const actions = ["acknowledged", "in_progress", "resolved", "closed", "cancelled"];

function error(message: string, status = 422) { return Response.json({ ok: false, error: message }, { status }); }
function reference(prefix: string) { return `${prefix}-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; }
function parseJson(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const view = cleanText(request.nextUrl.searchParams.get("view"), 30) || "escalations";
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 100), 1), 250);
  if (view === "matrix") {
    const { data, error: dbError } = await auth.client.from("escalation_rules").select(ruleFields).order("severity").order("escalation_level").limit(limit);
    if (dbError) return error(dbError.message, 500);
    return Response.json({ ok: true, data: data ?? [] });
  }
  if (view === "outbox") {
    const { data, error: dbError } = await auth.client.from("notification_outbox").select("id,escalation_id,recipient_id,channel,status,idempotency_key,payload,attempt_count,next_attempt_at,last_error,sent_at,created_at,updated_at").order("created_at", { ascending: false }).limit(limit);
    if (dbError) return error(dbError.message, 500);
    return Response.json({ ok: true, data: data ?? [] });
  }
  if (view === "history") {
    const escalationId = cleanText(request.nextUrl.searchParams.get("escalation_id"), 80);
    let query = auth.client.from("escalation_history").select("id,escalation_id,action,actor_id,previous_status,new_status,details,created_at").order("created_at", { ascending: false }).limit(limit);
    if (escalationId) query = query.eq("escalation_id", escalationId);
    const { data, error: dbError } = await query;
    if (dbError) return error(dbError.message, 500);
    return Response.json({ ok: true, data: data ?? [] });
  }
  const status = cleanText(request.nextUrl.searchParams.get("status"), 30);
  const severity = cleanText(request.nextUrl.searchParams.get("severity"), 20);
  let query = auth.client.from("escalations").select(escalationFields).order("created_at", { ascending: false }).limit(limit);
  if (status && statuses.includes(status)) query = query.eq("status", status);
  if (severity && severities.includes(severity)) query = query.eq("severity", severity);
  const { data, error: dbError } = await query;
  if (dbError) return error(dbError.message, 500);
  return Response.json({ ok: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return error("Escalation management requires HSE staff access.", 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const kind = cleanText(body?.kind, 20) || "escalation";
  if (kind === "dry_run") {
    const severity = cleanText(body?.severity, 20) || "high";
    const sourceType = cleanText(body?.source_type, 60) || "action";
    if (!severities.includes(severity)) return error("A valid severity is required.");
    const { data: rules, error: dbError } = await auth.client.from("escalation_rules").select(ruleFields).eq("source_type", sourceType).eq("severity", severity).eq("is_active", true).order("escalation_level");
    if (dbError) return error(dbError.message, 500);
    const matches = (rules ?? []).map((rule) => ({ rule, would_create: true, notification_channels: ["in_app"], write_performed: false }));
    return Response.json({ ok: true, data: { mode: "dry_run", source_type: sourceType, severity, matches, write_performed: false } });
  }
  if (kind === "rule") {
    const sourceType = cleanText(body?.source_type, 60);
    const severity = cleanText(body?.severity, 20);
    const responsibleRole = cleanText(body?.responsible_role, 100);
    const timeline = Number(body?.timeline_minutes);
    const level = Number(body?.escalation_level ?? 1);
    if (!sourceType || !responsibleRole || !severities.includes(severity) || !Number.isInteger(timeline) || timeline < 1 || !Number.isInteger(level) || level < 1 || level > 10) return error("Source, severity, responsible role, timeline, and level are required.");
    const { data, error: dbError } = await auth.client.from("escalation_rules").insert({ reference_no: reference("ESR"), source_type: sourceType, severity, timeline_minutes: timeline, escalation_level: level, responsible_role: responsibleRole, auto_flag: body?.auto_flag !== false, is_active: body?.is_active !== false, conditions: parseJson(body?.conditions), created_by: auth.user.id, updated_by: auth.user.id }).select(ruleFields).single();
    if (dbError || !data) return error(dbError?.message ?? "Escalation rule could not be created.");
    return Response.json({ ok: true, data }, { status: 201 });
  }
  const title = cleanText(body?.title, 240);
  const sourceType = cleanText(body?.source_type, 60);
  const severity = cleanText(body?.severity, 20);
  const responsibleRole = cleanText(body?.responsible_role, 100);
  if (!title || !sourceType || !responsibleRole || !severities.includes(severity)) return error("Title, source, responsible role, and valid severity are required.");
  const { data, error: dbError } = await auth.client.from("escalations").insert({ escalation_no: reference("ESC"), title, source_type: sourceType, source_id: cleanText(body?.source_id, 80) || null, source_reference: cleanText(body?.source_reference, 100) || null, severity, escalation_level: Number(body?.escalation_level ?? 1), responsible_role: responsibleRole, responsible_person_id: cleanText(body?.responsible_person_id, 80) || null, department_id: cleanText(body?.department_id, 80) || null, due_date: cleanText(body?.due_date, 40) || null, status: "open", details: parseJson(body?.details), created_by: auth.user.id }).select(escalationFields).single();
  if (dbError || !data) return error(dbError?.message ?? "Escalation could not be created.");
  await auth.client.from("escalation_history").insert({ escalation_id: data.id, action: "created", actor_id: auth.user.id, new_status: "open", details: { source: "manual" } });
  return Response.json({ ok: true, data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return error("Escalation management requires HSE staff access.", 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const kind = cleanText(body?.kind, 20) || "escalation";
  const id = cleanText(body?.id, 80);
  if (!id) return error("Record ID is required.");
  if (kind === "rule") {
    const severity = cleanText(body?.severity, 20);
    const timeline = Number(body?.timeline_minutes);
    const level = Number(body?.escalation_level ?? 1);
    if (!severities.includes(severity) || !Number.isInteger(timeline) || timeline < 1 || !Number.isInteger(level) || level < 1 || level > 10) return error("Valid severity, timeline, and level are required.");
    const { data, error: dbError } = await auth.client.from("escalation_rules").update({ source_type: cleanText(body?.source_type, 60), severity, timeline_minutes: timeline, escalation_level: level, responsible_role: cleanText(body?.responsible_role, 100), auto_flag: body?.auto_flag !== false, is_active: body?.is_active !== false, conditions: parseJson(body?.conditions), updated_by: auth.user.id, updated_at: new Date().toISOString() }).eq("id", id).select(ruleFields).single();
    if (dbError || !data) return error(dbError?.message ?? "Escalation rule could not be updated.");
    return Response.json({ ok: true, data });
  }
  const nextStatus = cleanText(body?.status, 30);
  if (!actions.includes(nextStatus)) return error("A valid status action is required.");
  const { data: previous } = await auth.client.from("escalations").select("status").eq("id", id).single();
  const now = new Date().toISOString();
  const patch = { status: nextStatus, updated_at: now, ...(nextStatus === "acknowledged" ? { acknowledged_at: now, acknowledged_by: auth.user.id } : {}), ...(nextStatus === "resolved" || nextStatus === "closed" ? { resolved_at: now, resolved_by: auth.user.id } : {}) };
  const { data, error: dbError } = await auth.client.from("escalations").update(patch).eq("id", id).select(escalationFields).single();
  if (dbError || !data) return error(dbError?.message ?? "Escalation status could not be updated.");
  await auth.client.from("escalation_history").insert({ escalation_id: id, action: nextStatus === "resolved" ? "resolved" : nextStatus === "closed" ? "closed" : nextStatus === "cancelled" ? "cancelled" : "status_updated", actor_id: auth.user.id, previous_status: previous?.status ?? null, new_status: nextStatus, details: { reason: cleanText(body?.reason, 500) || null } });
  return Response.json({ ok: true, data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return error("Escalation deletion requires HSE staff access.", 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const id = cleanText(body?.id, 80);
  if (!id || body?.confirm !== true) return error("ID and explicit confirmation are required.");
  const { error: dbError } = await auth.client.from("escalations").delete().eq("id", id);
  if (dbError) return error(dbError.message, 500);
  return Response.json({ ok: true, data: { deleted: id } });
}
