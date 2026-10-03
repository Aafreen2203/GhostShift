import { randomUUID } from "node:crypto";
import { embedText, incidentEmbeddingText } from "@/lib/embeddings";
import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import type { SystemEvent } from "@/types/event";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";

export type EvaluateEventResult = {
  openedIncidentId: string | null;
  reason: string;
};

const DB_CONNECTION_METRICS = new Set([
  "db_connections_pct",
  "database_connections",
]);

const LATENCY_METRICS = new Set(["latency_ms", "payment_latency_ms"]);

function isDbConnectionMetric(metric?: string): boolean {
  return Boolean(metric && DB_CONNECTION_METRICS.has(metric));
}

function isLatencyMetric(metric?: string): boolean {
  return Boolean(metric && LATENCY_METRICS.has(metric));
}

/**
 * Explicit demo rules (payment-api only for MVP):
 * 1) DB connections >= 96 opens an active saturation incident
 * 2) timeout / latency spike opens an incident when recent DB pressure >= 90
 *
 * Constraint: at most one active incident per service (not global).
 * Never auto-remediates — human decides after GhostShift evidence brief.
 */
export async function evaluateEvent(
  event: SystemEvent,
): Promise<EvaluateEventResult> {
  const serviceId = event.serviceId;

  // MVP: only payment-api has detection rules. Other services still store events.
  if (serviceId !== "payment-api") {
    return {
      openedIncidentId: null,
      reason: "No detection rule for this service.",
    };
  }

  const incidents = await getCollection<Incident>(COLLECTIONS.incidents);
  const existing = await incidents.findOne({
    serviceId,
    status: "active",
  });
  if (existing) {
    return {
      openedIncidentId: existing._id,
      reason: `Active incident already open for ${serviceId}: ${existing._id}`,
    };
  }

  const recentPressure = await hasRecentDbPressure(serviceId, 90);
  const criticalPool =
    isDbConnectionMetric(event.metric) &&
    typeof event.value === "number" &&
    event.value >= 96;
  const timeoutSignal =
    /timeout/i.test(event.message) ||
    (isLatencyMetric(event.metric) &&
      typeof event.value === "number" &&
      event.value >= 2000);

  if (!criticalPool && !(timeoutSignal && recentPressure)) {
    return {
      openedIncidentId: null,
      reason:
        "Event stored. Open an incident by sending DB connections 96% or timeout/latency after DB pressure >= 90%.",
    };
  }

  const services = await getCollection<Service>(COLLECTIONS.services);
  const service = await services.findOne({ _id: serviceId });
  const symptoms = [
    event.message,
    ...(recentPressure || criticalPool
      ? ["database connection saturation"]
      : []),
    ...(timeoutSignal
      ? ["intermittent payment timeout", "high latency"]
      : []),
  ];

  const draft: Incident = {
    _id: `inc-live-${randomUUID().slice(0, 8)}`,
    serviceId,
    title: criticalPool
      ? "Live payment API database connection saturation"
      : "Live payment timeout under database pressure",
    summary:
      "Opened from simulator/monitoring events. Search historical GhostShift memory for prior fixes.",
    symptoms: [...new Set(symptoms)],
    status: "active",
    severity: "high",
    historicalConfig: service?.currentConfig
      ? { ...service.currentConfig }
      : undefined,
    createdAt: new Date().toISOString(),
  };

  draft.embedding = await embedText(incidentEmbeddingText(draft));
  await incidents.insertOne(draft);
  await services.updateOne(
    { _id: serviceId },
    { $set: { status: "incident" } },
  );

  return {
    openedIncidentId: draft._id,
    reason: criticalPool
      ? "Opened because DB connections reached a critical threshold."
      : "Opened because a timeout/latency signal arrived while DB pressure was elevated.",
  };
}

async function hasRecentDbPressure(
  serviceId: string,
  threshold: number,
): Promise<boolean> {
  const events = await getCollection<SystemEvent>(COLLECTIONS.events);
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const hit = await events.findOne({
    serviceId,
    metric: { $in: [...DB_CONNECTION_METRICS] },
    value: { $gte: threshold },
    timestamp: { $gte: since },
  });
  return Boolean(hit);
}
