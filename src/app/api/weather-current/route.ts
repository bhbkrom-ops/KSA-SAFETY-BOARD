import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";
export async function GET(request: NextRequest) { const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; return Response.json({ ok: true, data: { configured: false, status: "not_configured", site_id: request.nextUrl.searchParams.get("site_id") || null, message: "Weather provider credentials are not configured for this deployment.", generated_at: new Date().toISOString() } }); }
