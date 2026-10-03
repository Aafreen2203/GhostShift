/**
 * Shared team contract. Coordinate before renaming these fields.
 * `successful` is true when the action helped (temporary or final).
 * It is false when `outcome` is "failed".
 */
export type ActionOutcome = "failed" | "temporary" | "resolved";

export interface IncidentAction {
  _id?: string;
  incidentId: string;
  serviceId: string;
  action: string;
  result: string;
  outcome: ActionOutcome;
  successful: boolean;
  timestamp?: string;
}
