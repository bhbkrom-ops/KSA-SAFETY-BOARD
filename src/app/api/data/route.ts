import { NextRequest } from "next/server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";
import { answerAssistant, buildOverviewSnapshot } from "@/lib/overview-server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth;
  const resource = request.nextUrl.searchParams.get("resource") ?? "dashboard-snapshot";
  if (!["dashboard-snapshot", "executive-hse", "daily-operations-command", "hse-assistant"].includes(resource)) return Response.json({ ok: false, error: "Unknown Overview resource." }, { status: 404 });
  try {
    if (resource === "hse-assistant") return Response.json({ ok: true, data: await answerAssistant(auth, request.nextUrl.searchParams.get("question") || "current HSE summary") });
    const snapshot = await buildOverviewSnapshot(auth);
    if (resource === "daily-operations-command") return Response.json({ ok: true, data: { ...snapshot, operational_condition: snapshot.kpis.active_vision_alerts > 0 || snapshot.kpis.overdue_actions > 0 ? "elevated" : "normal", priority_queue: snapshot.recent, controls: { source: "permission-scoped live records", refreshable: true } } });
    return Response.json({ ok: true, data: snapshot });
  } catch (error) { return Response.json({ ok: false, error: error instanceof Error ? error.message : "Overview data could not be loaded." }, { status: 500 }); }
}
