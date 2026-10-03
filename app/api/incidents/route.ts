import { randomUUID } from "node:crypto";
import { embedText, EMBEDDING_DIMENSIONS, incidentEmbeddingText } from "@/lib/embeddings";
import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import { jsonError, serverError } from "@/lib/http";
import type { IncidentAction } from "@/types/action";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types/incident";

export const runtime = "nodejs";

const STATUSES: readonly IncidentStatus[] = ["active", "resolved"];
const SEVERITIES: readonly IncidentSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

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

/**
 * Create a resolved incident record for organizational memory (Record page).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return jsonError("Request body must be a JSON object.", 400);
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const summary =
      typeof body.summary === "string" ? body.summary.trim() : "";
    const resolution =
      typeof body.resolution === "string" ? body.resolution.trim() : "";
    const serviceId =
      typeof body.serviceId === "string" ? body.serviceId.trim() : "payment-api";
    const rootCause =
      typeof body.rootCause === "string" ? body.rootCause.trim() : undefined;
    const severity =
      typeof body.severity === "string" &&
      SEVERITIES.includes(body.severity as IncidentSeverity)
        ? (body.severity as IncidentSeverity)
        : "medium";
    const symptoms = Array.isArray(body.symptoms)
      ? body.symptoms.filter((item): item is string => typeof item === "string")
      : summary
        ? [summary]
        : [];

    if (!title || !summary || !resolution) {
      return jsonError("title, summary, and resolution are required.", 400);
    }

    const now = new Date().toISOString();
    const incident: Incident = {
      _id: `INC-REC-${randomUUID().slice(0, 8)}`,
      serviceId,
      title,
      summary,
      symptoms,
      rootCause,
      resolution,
      status: "resolved",
      severity,
      createdAt: now,
      resolvedAt: now,
    };
    // Close the memory loop: verified resolution → document → embedding → searchable.
    incident.embedding = await embedText(incidentEmbeddingText(incident));

    const collection = await getCollection<Incident>(COLLECTIONS.incidents);
    await collection.insertOne(incident);

    const action: IncidentAction = {
      _id: `ACT-REC-${randomUUID().slice(0, 8)}`,
      incidentId: incident._id,
      serviceId,
      action: rootCause
        ? `Applied verified fix for: ${rootCause}`
        : "Applied verified resolution",
      result: resolution,
      outcome: "resolved",
      successful: true,
      timestamp: now,
    };
    const actions = await getCollection<IncidentAction>(COLLECTIONS.actions);
    await actions.insertOne(action);

    return Response.json(
      {
        ...incident,
        memory: {
          searchable: true,
          embeddingDimensions: EMBEDDING_DIMENSIONS,
          embeddingPath: "embedding",
          actionId: action._id,
          note: "Saved to MongoDB semantic memory — available to Vector Search next time.",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError("POST /api/incidents", error, "Failed to create incident");
  }
}
