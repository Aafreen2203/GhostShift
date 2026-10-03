import { analyseIncident, analyseQuery } from "@/lib/agent";
import { jsonError, serverError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      incidentId?: unknown;
      query?: unknown;
    } | null;

    if (body && typeof body.incidentId === "string" && body.incidentId.trim()) {
      const brief = await analyseIncident(body.incidentId.trim());
      return Response.json({ status: "ok", brief });
    }

    if (body && typeof body.query === "string" && body.query.trim()) {
      const brief = await analyseQuery(body.query.trim());
      return Response.json({ status: "ok", brief });
    }

    return jsonError("Provide incidentId or query.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyse";
    if (message === "Incident not found") {
      return jsonError(message, 404);
    }
    return serverError("POST /api/agent/analyse", error, "Failed to analyse incident");
  }
}
