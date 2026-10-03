import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import { jsonError, serverError } from "@/lib/http";
import type { Incident } from "@/types/incident";

export const runtime = "nodejs";

function parseResolution(
  body: unknown,
): { resolution: string; rootCause?: string } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }

  const value = body as Record<string, unknown>;
  if (typeof value.resolution !== "string" || value.resolution.trim() === "") {
    return { error: "resolution is required." };
  }
  if (value.rootCause !== undefined && typeof value.rootCause !== "string") {
    return { error: "rootCause must be a string." };
  }

  const resolution = value.resolution.trim();
  const rootCause =
    typeof value.rootCause === "string" ? value.rootCause.trim() : undefined;

  return rootCause ? { resolution, rootCause } : { resolution };
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/incidents/[id]/resolve">,
) {
  try {
    const { id } = await context.params;
    const parsed = parseResolution(await request.json().catch(() => null));
    if ("error" in parsed) {
      return jsonError(parsed.error, 400);
    }

    const collection = await getCollection<Incident>(COLLECTIONS.incidents);
    const updated = await collection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          status: "resolved",
          resolution: parsed.resolution,
          resolvedAt: new Date().toISOString(),
          ...(parsed.rootCause ? { rootCause: parsed.rootCause } : {}),
        },
      },
      { returnDocument: "after" },
    );

    if (!updated) {
      return jsonError("Incident not found", 404);
    }

    return Response.json(updated);
  } catch (error) {
    return serverError(
      "POST /api/incidents/:id/resolve",
      error,
      "Failed to resolve incident",
    );
  }
}
