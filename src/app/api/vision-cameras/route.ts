import { NextRequest } from "next/server";
import { cleanText } from "@/lib/live-meeting";
import { isAuthContext, requireAuth } from "@/lib/server-auth";

const publicFields = "id,camera_code,name,site_id,building,floor,area,zone,camera_type,rtsp_configured,stream_gateway_type,stream_gateway_ref,resolution,fps,firmware_version,nvr_server,nvr_channel,recording_enabled,analytics_enabled,enabled,camera_state,stream_state,analytics_state,last_seen_at,last_frame_at,reconnect_count,position,device_id,created_at,updated_at";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  let query = auth.client.from("vision_cameras").select(publicFields).order("name", { ascending: true }).limit(200);
  const status = request.nextUrl.searchParams.get("status"); const search = request.nextUrl.searchParams.get("search");
  if (status) query = query.eq("camera_state", status);
  if (search) query = query.or(`name.ilike.%${search}%,camera_code.ilike.%${search}%,area.ilike.%${search}%,zone.ilike.%${search}%`);
  const { data, error } = await query; if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return Response.json({ ok: false, error: "Vision camera management requires HSE staff access." }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = cleanText(body?.name, 160); const cameraCode = cleanText(body?.camera_code, 80);
  if (!name || !cameraCode) return Response.json({ ok: false, error: "Camera name and camera ID are required." }, { status: 422 });
  const { data, error } = await auth.client.from("vision_cameras").insert({ camera_code: cameraCode, name, site_id: cleanText(body?.site_id, 80) || null, building: cleanText(body?.building, 120) || null, floor: cleanText(body?.floor, 80) || null, area: cleanText(body?.area, 160) || null, zone: cleanText(body?.zone, 160) || null, camera_type: cleanText(body?.camera_type, 80) || "fixed_bullet", ip_address: cleanText(body?.ip_address, 64) || null, rtsp_endpoint: cleanText(body?.rtsp_endpoint, 500) || null, rtsp_configured: Boolean(body?.rtsp_endpoint), stream_gateway_type: ["webrtc", "hls", "ll_hls"].includes(String(body?.stream_gateway_type)) ? body?.stream_gateway_type : "none", stream_gateway_ref: cleanText(body?.stream_gateway_ref, 500) || null, resolution: cleanText(body?.resolution, 40) || null, fps: typeof body?.fps === "number" ? body.fps : null, recording_enabled: Boolean(body?.recording_enabled), analytics_enabled: Boolean(body?.analytics_enabled), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select(publicFields).single();
  if (error || !data) return Response.json({ ok: false, error: error?.message ?? "Camera could not be created." }, { status: 422 });
  return Response.json({ ok: true, data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return Response.json({ ok: false, error: "Vision camera management requires HSE staff access." }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const id = cleanText(body?.id, 80); if (!id) return Response.json({ ok: false, error: "Camera ID is required." }, { status: 422 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["name", "building", "floor", "area", "zone", "camera_type", "resolution", "firmware_version", "nvr_server", "nvr_channel", "stream_gateway_type", "stream_gateway_ref", "camera_state", "stream_state", "analytics_state"]) if (body?.[key] !== undefined) patch[key] = cleanText(body[key], 500);
  for (const key of ["enabled", "recording_enabled", "analytics_enabled"]) if (body?.[key] !== undefined) patch[key] = Boolean(body[key]);
  if (body?.rtsp_endpoint !== undefined) { patch.rtsp_endpoint = cleanText(body.rtsp_endpoint, 500) || null; patch.rtsp_configured = Boolean(patch.rtsp_endpoint); }
  const { data, error } = await auth.client.from("vision_cameras").update(patch).eq("id", id).select(publicFields).single();
  if (error || !data) return Response.json({ ok: false, error: error?.message ?? "Camera could not be updated." }, { status: 422 });
  return Response.json({ ok: true, data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  if (!auth.isStaff) return Response.json({ ok: false, error: "Vision camera management requires HSE staff access." }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id"); if (!id) return Response.json({ ok: false, error: "Camera ID is required." }, { status: 422 });
  const { error } = await auth.client.from("vision_cameras").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 422 });
  return Response.json({ ok: true, data: { id } });
}
