import { NextRequest } from "next/server";
import { createInviteToken, cleanText } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return Response.json({ ok: false, error: "Only HSE staff can rotate invite links." }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const meetingId = cleanText(body?.meeting_id, 80);
  if (!meetingId) return Response.json({ ok: false, error: "meeting_id is required." }, { status: 422 });
  const invite = createInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await auth.client.from("live_meetings").update({ access_mode: "invite_only", invite_token_hash: invite.hash, invite_expires_at: expiresAt, updated_at: new Date().toISOString() }).eq("id", meetingId).select("id,reference_no,access_mode,invite_expires_at").single();
  if (error || !data) return Response.json({ ok: false, error: error?.message ?? "Invite link could not be created." }, { status: 422 });
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  return Response.json({ ok: true, data: { ...data, invite_url: `${origin}/admin/live-meeting?meeting=${data.id}&invite=${invite.token}` } });
}
