import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import { serverError } from "@/lib/http";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";
import type { SystemEvent } from "@/types/event";

export const runtime = "nodejs";

/**
 * Demo reset — clears LIVE state only.
 *
 * DELETE/CLEAR: demo events, active incidents
 * KEEP: historical resolved incidents, actions, services, embeddings
 *
 * Restores all services to HEALTHY so UI baselines return.
 */
export async function POST() {
  try {
    const events = await getCollection<SystemEvent>(COLLECTIONS.events);
    const incidents = await getCollection<Incident>(COLLECTIONS.incidents);
    const services = await getCollection<Service>(COLLECTIONS.services);

    const eventsResult = await events.deleteMany({});
    const activeResult = await incidents.deleteMany({ status: "active" });
    await services.updateMany({}, { $set: { status: "healthy" } });

    const historicalKept = await incidents.countDocuments({
      status: "resolved",
    });

    return Response.json({
      status: "ok",
      cleared: {
        events: eventsResult.deletedCount,
        activeIncidents: activeResult.deletedCount,
      },
      kept: {
        historicalIncidents: historicalKept,
        actions: "unchanged",
        embeddings: "unchanged",
      },
      services: "healthy",
      message:
        "Demo reset: live events and active incidents cleared. Historical GhostShift memory kept. Services restored to HEALTHY.",
    });
  } catch (error) {
    return serverError("POST /api/demo/reset", error, "Failed to reset demo");
  }
}
