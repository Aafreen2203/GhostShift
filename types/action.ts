/**
 * Shared team contract. Coordinate before renaming these fields.
 * `successful` is true ONLY when outcome is "resolved".
 * For "failed" and "temporary", successful must be false.
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
