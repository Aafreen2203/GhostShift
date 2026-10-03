import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import { jsonError, serverError } from "@/lib/http";
import type { Incident, IncidentStatus } from "@/types/incident";

export const runtime = "nodejs";

const STATUSES: readonly IncidentStatus[] = ["active", "resolved"];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const serviceId = url.searchParams.get("serviceId");
    const filter: { status?: IncidentStatus; serviceId?: string } = {};

    if (status) {
      if (!STATUSES.includes(status as IncidentStatus)) {
        return jsonError("status must be active or resolved", 400);
      }
      filter.status = status as IncidentStatus;
    }

    if (serviceId) {
      filter.serviceId = serviceId;
    }

    const collection = await getCollection<Incident>(COLLECTIONS.incidents);
    const incidents = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(incidents);
  } catch (error) {
    return serverError("GET /api/incidents", error, "Failed to load incidents");
  }
}
