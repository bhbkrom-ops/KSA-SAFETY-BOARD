import { NextRequest } from "next/server";
import { answerAssistant } from "@/lib/overview-server";
import { isAuthContext, requireAuth } from "@/lib/server-auth";
export async function GET(request: NextRequest) { const auth = await requireAuth(request); if (!isAuthContext(auth)) return auth; try { return Response.json({ ok: true, data: await answerAssistant(auth, request.nextUrl.searchParams.get("question") || "current HSE summary") }); } catch (error) { return Response.json({ ok: false, error: error instanceof Error ? error.message : "Assistant data could not be loaded." }, { status: 500 }); } }
