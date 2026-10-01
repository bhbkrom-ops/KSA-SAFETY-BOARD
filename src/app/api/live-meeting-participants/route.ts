import { NextRequest } from "next/server";
import { cleanText } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const meetingId = request.nextUrl.searchParams.get("meeting_id");
  if (!meetingId) return Response.json({ ok: false, error: "meeting_id is required." }, { status: 422 });
  const { data, error } = await auth.client.from("live_meeting_participants").select("id,meeting_id,user_id,invite_email,display_name,role,status,joined_at,left_at,created_at,updated_at").eq("meeting_id", meetingId).order("created_at", { ascending: true });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const meetingId = cleanText(body?.meeting_id, 80);
  const action = cleanText(body?.action, 20) || "invite";
  if (!meetingId) return Response.json({ ok: false, error: "meeting_id is required." }, { status: 422 });

  if (action === "join" || action === "leave") {
    const status = action === "join" ? "joined" : "left";
    const patch = { status, ...(action === "join" ? { joined_at: new Date().toISOString() } : { left_at: new Date().toISOString() }) };
    const { data, error } = await auth.client.from("live_meeting_participants").update(patch).eq("meeting_id", meetingId).eq("user_id", auth.user.id).select("*").maybeSingle();
    if (error || !data) return Response.json({ ok: false, error: error?.message ?? "You are not invited to this meeting." }, { status: 403 });
    return Response.json({ ok: true, data });
  }

  if (!auth.isStaff) return Response.json({ ok: false, error: "Only HSE staff can invite participants." }, { status: 403 });
  const email = cleanText(body?.invite_email, 320).toLowerCase() || null;
  const userId = cleanText(body?.user_id, 80) || null;
  const displayName = cleanText(body?.display_name, 160) || email;
  if (!email && !userId) return Response.json({ ok: false, error: "Provide a user_id or invite_email." }, { status: 422 });
  const { data, error } = await auth.client.from("live_meeting_participants").insert({ meeting_id: meetingId, user_id: userId, invite_email: email, display_name: displayName, role: "participant", status: "invited" }).select("*").single();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 422 });
  return Response.json({ ok: true, data }, { status: 201 });
}
