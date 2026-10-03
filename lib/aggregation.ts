/**
 * WORKSTREAM 1 — MongoDB / Backend
 *
 * TODO: Add aggregation pipelines for action outcomes and knowledge freshness.
 * Compare `incident.historicalConfig` with `service.currentConfig` and say
 * when a past fix may no longer match the running system.
 * Do not implement the pipelines in this foundation pass.
 */

export type ActionSummary = {
  incidentId: string;
  failed: number;
  temporary: number;
  resolved: number;
};

export type FreshnessReport = {
  incidentId: string;
  serviceId: string;
  outdated: boolean;
  notes: string[];
};

export async function summarizeActions(incidentId: string): Promise<ActionSummary> {
  void incidentId;
  throw new Error("Action aggregation is not implemented yet.");
}

export async function compareKnowledgeFreshness(
  incidentId: string,
): Promise<FreshnessReport> {
  void incidentId;
  throw new Error("Knowledge freshness comparison is not implemented yet.");
}
