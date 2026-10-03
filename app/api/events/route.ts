import { randomUUID } from "node:crypto";
import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import { jsonError, serverError } from "@/lib/http";
import type { SystemEvent, SystemEventSeverity, SystemEventType } from "@/types/event";

export const runtime = "nodejs";

const EVENT_TYPES: readonly SystemEventType[] = [
  "metric",
  "error",
  "warning",
  "deployment",
];
const EVENT_SEVERITIES: readonly SystemEventSeverity[] = [
  "info",
  "warning",
  "critical",
];

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function parseEvent(
  body: unknown,
): { event: SystemEvent } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }

  const value = body as Record<string, unknown>;
  if (typeof value.serviceId !== "string" || value.serviceId.trim() === "") {
    return { error: "serviceId is required." };
  }
  if (!isOneOf(value.type, EVENT_TYPES)) {
    return { error: "type must be metric, error, warning, or deployment." };
  }
  if (typeof value.message !== "string" || value.message.trim() === "") {
    return { error: "message is required." };
  }
  if (!isOneOf(value.severity, EVENT_SEVERITIES)) {
    return { error: "severity must be info, warning, or critical." };
  }
  if (typeof value.timestamp !== "string" || Number.isNaN(Date.parse(value.timestamp))) {
    return { error: "timestamp must be an ISO date string." };
  }
  if (value.metric !== undefined && typeof value.metric !== "string") {
    return { error: "metric must be a string." };
  }
  if (value.value !== undefined && typeof value.value !== "number") {
    return { error: "value must be a number." };
  }
  if (value.max !== undefined && typeof value.max !== "number") {
    return { error: "max must be a number." };
  }

  const event: SystemEvent = {
    _id: randomUUID(),
    serviceId: value.serviceId.trim(),
    type: value.type,
    message: value.message.trim(),
    severity: value.severity,
    timestamp: value.timestamp,
  };

  if (typeof value.metric === "string") event.metric = value.metric;
  if (typeof value.value === "number") event.value = value.value;
  if (typeof value.max === "number") event.max = value.max;

  return { event };
}

export async function POST(request: Request) {
  try {
    const parsed = parseEvent(await request.json().catch(() => null));
    if ("error" in parsed) {
      return jsonError(parsed.error, 400);
    }

    const collection = await getCollection<SystemEvent>(COLLECTIONS.events);
    await collection.insertOne(parsed.event);
    return Response.json(parsed.event, { status: 201 });
  } catch (error) {
    return serverError("POST /api/events", error, "Failed to store event");
  }
}
