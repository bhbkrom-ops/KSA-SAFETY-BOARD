import { NextRequest } from "next/server";
import { cleanText } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  let query = auth.client.from("vision_alerts").select("id,event_key,category,violation_type,severity,status,confidence,camera_id,device_id,zone_id,rule_id,event_timestamp,received_at,thumbnail_ref,human_verified,acknowledgement_note,acknowledged_by,acknowledged_at,resolved_by,resolved_at,metadata,created_at").order("event_timestamp", { ascending: false }).limit(250);
  const status = request.nextUrl.searchParams.get("status"); const category = request.nextUrl.searchParams.get("category");
  if (status) query = query.eq("status", status); if (category) query = query.eq("category", category);
  const { data, error } = await query; if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return Response.json({ ok: false, error: "Vision alert actions require HSE staff access." }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null; const id = cleanText(body?.id, 80); const status = cleanText(body?.status, 30);
  if (!id || !["acknowledged", "under_review", "resolved", "false_positive"].includes(status)) return Response.json({ ok: false, error: "Alert ID and a valid action status are required." }, { status: 422 });
  const update: Record<string, unknown> = { status, acknowledgement_note: cleanText(body?.note, 2000) || null };
  if (status === "acknowledged" || status === "under_review") { update.acknowledged_by = auth.user.id; update.acknowledged_at = new Date().toISOString(); }
  if (status === "resolved" || status === "false_positive") { update.resolved_by = auth.user.id; update.resolved_at = new Date().toISOString(); }
  const { data, error } = await auth.client.from("vision_alerts").update(update).eq("id", id).select("id,status,acknowledgement_note,acknowledged_by,acknowledged_at,resolved_by,resolved_at").single();
  if (error || !data) return Response.json({ ok: false, error: error?.message ?? "Alert could not be updated." }, { status: 422 });
  return Response.json({ ok: true, data });
}
