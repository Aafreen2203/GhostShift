import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import type { IncidentAction } from "@/types/action";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";

export type ActionSummary = {
  incidentId: string;
  failed: number;
  temporary: number;
  resolved: number;
};

export type FreshnessNote = {
  key: string;
  historical: unknown;
  current: unknown;
};

export type FreshnessReport = {
  incidentId: string;
  serviceId: string;
  outdated: boolean;
  notes: string[];
  differences: FreshnessNote[];
};

export async function summarizeActions(incidentId: string): Promise<ActionSummary> {
  const collection = await getCollection<IncidentAction>(COLLECTIONS.actions);
  const rows = await collection
    .aggregate<{ _id: IncidentAction["outcome"]; count: number }>([
      { $match: { incidentId } },
      { $group: { _id: "$outcome", count: { $sum: 1 } } },
    ])
    .toArray();

  const summary: ActionSummary = {
    incidentId,
    failed: 0,
    temporary: 0,
    resolved: 0,
  };

  for (const row of rows) {
    if (row._id === "failed") summary.failed = row.count;
    if (row._id === "temporary") summary.temporary = row.count;
    if (row._id === "resolved") summary.resolved = row.count;
  }

  return summary;
}

function flattenConfig(
  value: Record<string, unknown>,
  prefix = "",
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      nested &&
      typeof nested === "object" &&
      !Array.isArray(nested)
    ) {
      Object.assign(out, flattenConfig(nested as Record<string, unknown>, path));
    } else {
      out[path] = nested;
    }
  }
  return out;
}

/**
 * Compare the config captured during an incident with the service's current config.
 * Warn when a historical fix may no longer match the live system.
 */
export async function compareKnowledgeFreshness(
  incidentId: string,
): Promise<FreshnessReport> {
  const incidents = await getCollection<Incident>(COLLECTIONS.incidents);
  const services = await getCollection<Service>(COLLECTIONS.services);

  const incident = await incidents.findOne({ _id: incidentId });
  if (!incident) {
    throw new Error("Incident not found");
  }

  const service = await services.findOne({ _id: incident.serviceId });
  if (!service) {
    return {
      incidentId,
      serviceId: incident.serviceId,
      outdated: false,
      notes: ["Service record not found; freshness could not be compared."],
      differences: [],
    };
  }

  const historical = flattenConfig(incident.historicalConfig ?? {});
  const current = flattenConfig(service.currentConfig ?? {});
  const keys = new Set([...Object.keys(historical), ...Object.keys(current)]);
  const differences: FreshnessNote[] = [];

  for (const key of keys) {
    const left = historical[key];
    const right = current[key];
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      differences.push({ key, historical: left, current: right });
    }
  }

  const notes = differences.map((diff) => {
    if (diff.historical === undefined) {
      return `${diff.key} was not present historically; live value is ${JSON.stringify(diff.current)}.`;
    }
    if (diff.current === undefined) {
      return `${diff.key} was ${JSON.stringify(diff.historical)} during the incident; it is missing from live config.`;
    }
    return `${diff.key} changed from ${JSON.stringify(diff.historical)} to ${JSON.stringify(diff.current)}.`;
  });

  if (differences.length > 0) {
    notes.unshift(
      "Historical knowledge may be outdated relative to the current system configuration.",
    );
  } else {
    notes.push("Historical config matches the current service configuration.");
  }

  return {
    incidentId,
    serviceId: incident.serviceId,
    outdated: differences.length > 0,
    notes,
    differences,
  };
}
