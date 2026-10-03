import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import { serverError } from "@/lib/http";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";
import type { SystemEvent } from "@/types/event";

export const runtime = "nodejs";

/**
 * Demo helper: clear live events and active simulator-created incidents.
 * Historical seeded resolved incidents are kept.
 */
export async function POST() {
  try {
    const events = await getCollection<SystemEvent>(COLLECTIONS.events);
    const incidents = await getCollection<Incident>(COLLECTIONS.incidents);
    const services = await getCollection<Service>(COLLECTIONS.services);

    await events.deleteMany({});
    await incidents.deleteMany({
      status: "active",
      _id: { $regex: "^inc-live-" },
    });
    await services.updateMany({}, { $set: { status: "healthy" } });

    return Response.json({
      status: "ok",
      message:
        "Cleared live events and simulator-created active incidents. Run npm run seed to fully restore demo data.",
    });
  } catch (error) {
    return serverError("POST /api/demo/reset", error, "Failed to reset demo");
  }
}
