/**
 * Shared team contract. Coordinate before renaming these fields.
 */
export type SystemEventType = "metric" | "error" | "warning" | "deployment";

export type SystemEventSeverity = "info" | "warning" | "critical";

export interface SystemEvent {
  _id?: string;
  serviceId: string;
  type: SystemEventType;
  metric?: string;
  value?: number;
  max?: number;
  message: string;
  severity: SystemEventSeverity;
  timestamp: string;
}
