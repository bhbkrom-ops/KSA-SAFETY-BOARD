export function GET() {
  return Response.json({
    status: "ok",
    service: "ksa-safety-board",
    timestamp: new Date().toISOString(),
  });
}
