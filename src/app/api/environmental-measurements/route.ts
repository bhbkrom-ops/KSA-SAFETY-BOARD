/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { cleanText } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

const fields = "id,reference_no,factory,site_id,area,contractor_name,measurement_type,parameter_name,measured_value,unit,limit_reference,limit_reference_unit,limit_reference_source,compliance_status,measured_at,due_at,reminder_enabled,reminder_days_before,reminder_last_processed_at,notes,evidence_url,owner_id,created_by,created_at,updated_at";
const types = ["air_quality","noise","workplace_exposure","emissions","water","waste_soil","other"];
const statuses = ["PENDING","COMPLIANT","NON_COMPLIANT"];
function error(message: string, status = 422) { return Response.json({ ok: false, error: message }, { status }); }
function schedule(due: unknown) { if (!due) return "NO DATE"; const ms = new Date(String(due)).getTime() - Date.now(); if (ms < 0) return "OVERDUE"; if (ms < 14 * 86400000) return "DUE SOON"; return "SCHEDULED"; }
function decorate(row: Record<string, unknown>) { return { ...row, schedule_indicator: schedule(row.due_at) }; }
function bodyValue(body: Record<string, unknown> | null, key: string, max = 500) { return cleanText(body?.[key], max) || null; }

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  const client = auth.client as any; const params = request.nextUrl.searchParams;
  const query = client.from("environmental_measurements").select(fields).order("due_at", { ascending: true }).limit(250);
  const { data, error: dbError } = await query; if (dbError) return error(dbError.message, 500);
  let rows = (data ?? []).map(decorate);
  const type = params.get("measurement_type"); const status = params.get("compliance_status"); const scheduleValue = params.get("schedule");
  if (type) rows = rows.filter((row: any) => row.measurement_type === type); if (status) rows = rows.filter((row: any) => row.compliance_status === status); if (scheduleValue) rows = rows.filter((row: any) => row.schedule_indicator === scheduleValue);
  return Response.json({ ok: true, data: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return error("Environmental changes require HSE staff access.", 403);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (body?.action === "process_reminders") { const { data, error: rpcError } = await (auth.client as any).rpc("process_environmental_measurement_reminders", { p_as_of: new Date().toISOString() }); if (rpcError) return error(rpcError.message, 500); return Response.json({ ok: true, data: { processed: data ?? 0 } }); }
  const type = bodyValue(body, "measurement_type", 40); const parameter = bodyValue(body, "parameter_name", 160); if (!type || !types.includes(type) || !parameter) return error("Measurement type and parameter name are required.");
  const status = bodyValue(body, "compliance_status", 20) || "PENDING"; if (!statuses.includes(status)) return error("Invalid compliance status.");
  const payload = { reference_no: bodyValue(body, "reference_no", 80) || `ENV-M-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`, factory: bodyValue(body, "factory", 160), site_id: bodyValue(body, "site_id", 80), area: bodyValue(body, "area", 180), contractor_name: bodyValue(body, "contractor_name", 180), measurement_type: type, parameter_name: parameter, measured_value: typeof body?.measured_value === "number" ? body.measured_value : null, unit: bodyValue(body, "unit", 40), limit_reference: typeof body?.limit_reference === "number" ? body.limit_reference : null, limit_reference_unit: bodyValue(body, "limit_reference_unit", 40), limit_reference_source: bodyValue(body, "limit_reference_source", 300), compliance_status: status, measured_at: bodyValue(body, "measured_at", 40), due_at: bodyValue(body, "due_at", 40), reminder_enabled: body?.reminder_enabled !== false, reminder_days_before: Math.min(365, Math.max(0, Number(body?.reminder_days_before ?? 30))), notes: bodyValue(body, "notes", 2000), evidence_url: bodyValue(body, "evidence_url", 500), owner_id: bodyValue(body, "owner_id", 80), created_by: auth.user.id };
  const { data, error: dbError } = await (auth.client as any).from("environmental_measurements").insert(payload).select(fields).single(); if (dbError || !data) return error(dbError?.message ?? "Measurement could not be created."); return Response.json({ ok: true, data: decorate(data) }, { status: 201 });
}

export async function PATCH(request: NextRequest) { const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return error("Environmental changes require HSE staff access.", 403); const body = await request.json().catch(() => null) as Record<string, unknown> | null; const id = bodyValue(body, "id", 80); if (!id) return error("Measurement ID is required."); const patch: Record<string, unknown> = {}; for (const key of ["factory","area","contractor_name","measurement_type","parameter_name","unit","limit_reference_unit","limit_reference_source","compliance_status","measured_at","due_at","notes","evidence_url"]) if (body?.[key] !== undefined) patch[key] = key === "compliance_status" && !statuses.includes(String(body[key])) ? "PENDING" : bodyValue(body, key, 2000); for (const key of ["measured_value","limit_reference","reminder_days_before"]) if (body?.[key] !== undefined) patch[key] = Number(body[key]); if (body?.reminder_enabled !== undefined) patch.reminder_enabled = Boolean(body.reminder_enabled); patch.updated_at = new Date().toISOString(); const { data, error: dbError } = await (auth.client as any).from("environmental_measurements").update(patch).eq("id", id).select(fields).single(); if (dbError || !data) return error(dbError?.message ?? "Measurement could not be updated."); return Response.json({ ok: true, data: decorate(data) }); }
export async function DELETE(request: NextRequest) { const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; if (!auth.isStaff) return error("Environmental changes require HSE staff access.", 403); const id = request.nextUrl.searchParams.get("id"); if (!id) return error("Measurement ID is required."); const { error: dbError } = await (auth.client as any).from("environmental_measurements").delete().eq("id", id); if (dbError) return error(dbError.message, 500); return Response.json({ ok: true, data: { id, deleted: true } }); }
