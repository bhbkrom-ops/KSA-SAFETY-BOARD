import { NextRequest } from "next/server";
import { cleanText } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const meetingId = request.nextUrl.searchParams.get("meeting_id");
  if (!meetingId) return Response.json({ ok: false, error: "meeting_id is required." }, { status: 422 });
  const { data, error } = await auth.client.from("live_meeting_messages").select("id,meeting_id,sender_id,body,created_at").eq("meeting_id", meetingId).order("created_at", { ascending: true }).limit(200);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const meetingId = cleanText(body?.meeting_id, 80);
  const message = cleanText(body?.body, 2000);
  if (!meetingId || !message) return Response.json({ ok: false, error: "meeting_id and message body are required." }, { status: 422 });
  const { data, error } = await auth.client.from("live_meeting_messages").insert({ meeting_id: meetingId, sender_id: auth.user.id, body: message }).select("id,meeting_id,sender_id,body,created_at").single();
  if (error || !data) return Response.json({ ok: false, error: error?.message ?? "Message could not be sent." }, { status: 422 });
  return Response.json({ ok: true, data }, { status: 201 });
}
