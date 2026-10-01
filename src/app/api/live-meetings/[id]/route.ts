import { NextRequest } from "next/server";
import { canTransitionMeeting, cleanText } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const { id } = await params;
  const { data, error } = await auth.client.from("live_meetings").select("*,live_meeting_participants(*),live_meeting_minutes(*)").eq("id", id).maybeSingle();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return Response.json({ ok: false, error: "Meeting not found." }, { status: 404 });
  return Response.json({ ok: true, data });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return Response.json({ ok: false, error: "You do not have permission to manage meeting lifecycle." }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const { data: current, error: currentError } = await auth.client.from("live_meetings").select("id,status,host_id,scheduled_start,scheduled_end,title,description").eq("id", id).maybeSingle();
  if (currentError) return Response.json({ ok: false, error: currentError.message }, { status: 500 });
  if (!current) return Response.json({ ok: false, error: "Meeting not found." }, { status: 404 });

  const requestedStatus = body?.status as string | undefined;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (requestedStatus && ["scheduled", "live", "completed", "cancelled"].includes(requestedStatus)) {
    if (!canTransitionMeeting(current.status as "scheduled" | "live" | "completed" | "cancelled", requestedStatus as "scheduled" | "live" | "completed" | "cancelled")) return Response.json({ ok: false, error: `Cannot move a ${current.status} meeting to ${requestedStatus}.` }, { status: 409 });
    update.status = requestedStatus;
    if (requestedStatus === "live") update.started_at = new Date().toISOString();
    if (requestedStatus === "completed") update.completed_at = new Date().toISOString();
    if (requestedStatus === "cancelled") update.cancelled_at = new Date().toISOString();
  }
  if (current.status !== "scheduled" && (body?.title !== undefined || body?.description !== undefined || body?.scheduled_start !== undefined)) {
    return Response.json({ ok: false, error: "Only scheduled meetings can be edited." }, { status: 409 });
  }
  if (body?.title !== undefined) update.title = cleanText(body.title, 160);
  if (body?.description !== undefined) update.description = cleanText(body.description, 4000) || null;
  if (body?.scheduled_start !== undefined) update.scheduled_start = new Date(cleanText(body.scheduled_start, 80)).toISOString();
  if (body?.scheduled_end !== undefined) update.scheduled_end = body.scheduled_end ? new Date(cleanText(body.scheduled_end, 80)).toISOString() : null;

  const { data, error } = await auth.client.from("live_meetings").update(update).eq("id", id).select("*").single();
  if (error || !data) return Response.json({ ok: false, error: error?.message ?? "Meeting could not be updated." }, { status: 422 });
  return Response.json({ ok: true, data });
}
