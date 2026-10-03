/**
 * Shared team contract. Coordinate before renaming these fields.
 * Leave `embedding` empty until Workstream 2 stores a real vector.
 */
export type IncidentStatus = "active" | "resolved";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface Incident {
  _id: string;
  serviceId: string;
  title: string;
  summary: string;
  symptoms: string[];
  rootCause?: string;
  resolution?: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  historicalConfig?: Record<string, unknown>;
  embedding?: number[];
  createdAt: string;
  resolvedAt?: string;
}
