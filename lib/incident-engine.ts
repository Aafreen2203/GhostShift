import type { SystemEvent } from "@/types/event";

/**
 * WORKSTREAM 1 — MongoDB / Backend
 *
 * TODO: Decide when a stream of system events should open an incident.
 * Read from the events collection. Write an active incident only when the
 * rules are explicit and easy to explain in the demo.
 * Do not auto-remediate production systems.
 * POST /api/events currently stores the event and stops there.
 */
export async function evaluateEvent(
  event: SystemEvent,
): Promise<{ openedIncidentId: string | null }> {
  void event;
  throw new Error("Incident detection is not implemented yet.");
}
