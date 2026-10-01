import { NextRequest } from "next/server";
import { cleanText, createInviteToken, createMeetingReference } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const status = request.nextUrl.searchParams.get("status");
  let query = auth.client
    .from("live_meetings")
    .select("id,reference_no,title,description,scheduled_start,scheduled_end,status,access_mode,host_id,site_id,started_at,completed_at,cancelled_at,created_at,updated_at")
    .order("scheduled_start", { ascending: false })
    .limit(100);
  if (status && ["scheduled", "live", "completed", "cancelled"].includes(status)) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return Response.json({ ok: false, error: "You do not have permission to create meetings." }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const title = cleanText(body?.title, 160);
  const description = cleanText(body?.description, 4000) || null;
  const scheduledStart = cleanText(body?.scheduled_start, 80);
  const scheduledEnd = cleanText(body?.scheduled_end, 80) || null;
  const accessMode = body?.access_mode === "invite_only" ? "invite_only" : "authenticated";
  if (title.length < 3 || !scheduledStart || (scheduledEnd && new Date(scheduledEnd) <= new Date(scheduledStart))) {
    return Response.json({ ok: false, error: "Provide a valid title and meeting schedule." }, { status: 422 });
  }

  const invite = accessMode === "invite_only" ? createInviteToken() : null;
  const { data, error } = await auth.client
    .from("live_meetings")
    .insert({
      reference_no: createMeetingReference(),
      title,
      description,
      scheduled_start: new Date(scheduledStart).toISOString(),
      scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
      access_mode: accessMode,
      host_id: auth.user.id,
      created_by: auth.user.id,
      invite_token_hash: invite?.hash ?? null,
      invite_expires_at: invite ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
    })
    .select("id,reference_no,title,description,scheduled_start,scheduled_end,status,access_mode,host_id,site_id,created_at,updated_at")
    .single();
  if (error || !data) return Response.json({ ok: false, error: error?.message ?? "Meeting could not be created." }, { status: 422 });

  const participant = await auth.client.from("live_meeting_participants").insert({ meeting_id: data.id, user_id: auth.user.id, display_name: auth.profile.display_name, role: "host", status: "invited" });
  if (participant.error) return Response.json({ ok: false, error: participant.error.message }, { status: 422 });

  return Response.json({ ok: true, data: { meeting: data, invite_token: invite?.token ?? null } }, { status: 201 });
}
