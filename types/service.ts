/**
 * Shared team contract. Coordinate before renaming these fields.
 */
export type ServiceStatus = "healthy" | "warning" | "incident";

export interface Service {
  _id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  ownerTeam: string;
  technologies: string[];
  currentConfig: Record<string, unknown>;
}
