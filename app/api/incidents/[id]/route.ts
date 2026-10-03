import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import { jsonError, serverError } from "@/lib/http";
import type { Incident } from "@/types/incident";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/incidents/[id]">,
) {
  try {
    const { id } = await context.params;
    const collection = await getCollection<Incident>(COLLECTIONS.incidents);
    const incident = await collection.findOne({ _id: id });

    if (!incident) {
      return jsonError("Incident not found", 404);
    }

    return Response.json(incident);
  } catch (error) {
    return serverError("GET /api/incidents/:id", error, "Failed to load incident");
  }
}
