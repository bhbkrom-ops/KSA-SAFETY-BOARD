import { NextRequest } from "next/server";
import { cleanText } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

type ActionItem = { title?: unknown; description?: unknown; due_date?: unknown; priority?: unknown; owner_id?: unknown };

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const meetingId = request.nextUrl.searchParams.get("meeting_id");
  if (!meetingId) return Response.json({ ok: false, error: "meeting_id is required." }, { status: 422 });
  const { data, error } = await auth.client.from("live_meeting_minutes").select("*").eq("meeting_id", meetingId).maybeSingle();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return Response.json({ ok: false, error: "Only HSE staff can update meeting minutes." }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const meetingId = cleanText(body?.meeting_id, 80);
  const content = cleanText(body?.content, 20000);
  const decisions = cleanText(body?.decisions, 10000) || null;
  const actionItems = Array.isArray(body?.action_items) ? (body?.action_items as ActionItem[]).slice(0, 50).map((item) => ({ title: cleanText(item.title, 240), description: cleanText(item.description, 2000), due_date: cleanText(item.due_date, 30) || null, priority: ["low", "medium", "high", "critical"].includes(String(item.priority)) ? item.priority : "medium", owner_id: cleanText(item.owner_id, 80) || null })).filter((item) => item.title.length >= 3) : [];
  if (!meetingId || content.length < 3) return Response.json({ ok: false, error: "Meeting and minutes content are required." }, { status: 422 });

  const existing = await auth.client.from("live_meeting_minutes").select("id,version,created_by").eq("meeting_id", meetingId).maybeSingle();
  if (existing.error) return Response.json({ ok: false, error: existing.error.message }, { status: 500 });
  const payload = { meeting_id: meetingId, content, decisions, action_items: actionItems, version: Number(existing.data?.version ?? 0) + 1, created_by: existing.data?.created_by ?? auth.user.id, updated_by: auth.user.id, updated_at: new Date().toISOString() };
  const { data, error } = await auth.client.from("live_meeting_minutes").upsert(payload, { onConflict: "meeting_id" }).select("*").single();
  if (error || !data) return Response.json({ ok: false, error: error?.message ?? "Minutes could not be saved." }, { status: 422 });

  const createdActions: unknown[] = [];
  for (const item of actionItems) {
    const action = await auth.client.from("actions").insert({ reference_no: `ACT-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, source_type: "meeting", source_id: meetingId, title: item.title, description: item.description || null, priority: item.priority, owner_id: item.owner_id, due_date: item.due_date, created_by: auth.user.id }).select("id,reference_no,title,status,priority,due_date").single();
    if (action.error) return Response.json({ ok: false, error: `Minutes saved, but an action item failed: ${action.error.message}`, data: { minutes: data, created_actions: createdActions } }, { status: 422 });
    if (action.data) createdActions.push(action.data);
  }
  return Response.json({ ok: true, data: { minutes: data, created_actions: createdActions } });
}
