import { compareKnowledgeFreshness } from "@/lib/aggregation";
import { jsonError, serverError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/incidents/[id]/freshness">,
) {
  try {
    const { id } = await context.params;
    const report = await compareKnowledgeFreshness(id);
    return Response.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed freshness check";
    if (message === "Incident not found") {
      return jsonError(message, 404);
    }
    return serverError(
      "GET /api/incidents/:id/freshness",
      error,
      "Failed to compare knowledge freshness",
    );
  }
}
