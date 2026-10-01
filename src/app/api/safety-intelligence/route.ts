import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";
import { buildOverviewSnapshot } from "@/lib/overview-server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  try {
    const snapshot = await buildOverviewSnapshot(auth);
    return Response.json({ ok: true, data: { generated_at: snapshot.generated_at, freshness: snapshot.freshness, leading: snapshot.leading, lagging: snapshot.lagging, indicators: snapshot.kpis, coverage: snapshot.coverage, filter: { site_id: request.nextUrl.searchParams.get("site_id") || null, period: request.nextUrl.searchParams.get("period") || "current" } } });
  } catch (error) { return Response.json({ ok: false, error: error instanceof Error ? error.message : "Safety Intelligence could not be loaded." }, { status: 500 }); }
}
