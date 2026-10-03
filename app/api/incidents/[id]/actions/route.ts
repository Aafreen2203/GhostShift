import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import { jsonError, serverError } from "@/lib/http";
import type { IncidentAction } from "@/types/action";
import type { Incident } from "@/types/incident";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/incidents/[id]/actions">,
) {
  try {
    const { id } = await context.params;
    const incidents = await getCollection<Incident>(COLLECTIONS.incidents);
    const incident = await incidents.findOne({ _id: id });

    if (!incident) {
      return jsonError("Incident not found", 404);
    }

    const actions = await getCollection<IncidentAction>(COLLECTIONS.actions);
    const history = await actions
      .find({ incidentId: id })
      .sort({ timestamp: 1 })
      .toArray();

    return Response.json(history);
  } catch (error) {
    return serverError(
      "GET /api/incidents/:id/actions",
      error,
      "Failed to load actions",
    );
  }
}
