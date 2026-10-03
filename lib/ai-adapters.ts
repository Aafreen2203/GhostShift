import { aggregatePreviousActions } from "@/src/ai/services/actionAggregator";
import type { ActionAttemptSummary } from "@/src/ai/types/analysis";
import type {
  CurrentIncident,
  HistoricalAction,
  HistoricalIncident,
  SystemState,
} from "@/src/ai/types/incident";
import type { IncidentAction } from "@/types/action";
import type { Incident } from "@/types/incident";
import type { Service } from "@/types/service";

function configToSystemState(
  config?: Record<string, unknown>,
): SystemState | undefined {
  if (!config) return undefined;
  const configuration: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(config)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      configuration[key] = value;
    }
  }
  const databaseConnectionLimit =
    typeof config.connectionPoolMax === "number"
      ? config.connectionPoolMax
      : typeof config.redisPoolMax === "number"
        ? config.redisPoolMax
        : undefined;

  return {
    databaseConnectionLimit,
    databaseVersion:
      typeof config.database === "string" ? config.database : undefined,
    architecture:
      typeof config.provider === "string" ? config.provider : undefined,
    configuration,
  };
}

function mapOutcomeToAiResult(
  outcome: IncidentAction["outcome"],
): HistoricalAction["result"] {
  if (outcome === "resolved") return "successful";
  if (outcome === "temporary") return "temporary";
  if (outcome === "failed") return "failed";
  return "unknown";
}

export function toHistoricalIncident(
  incident: Incident,
  actions: IncidentAction[],
  score?: number,
): HistoricalIncident {
  return {
    id: incident._id,
    title: incident.title,
    description: incident.summary,
    service: incident.serviceId,
    occurredAt: incident.createdAt,
    symptoms: incident.symptoms,
    systemState: configToSystemState(incident.historicalConfig),
    attemptedActions: actions.map((action) => ({
      action: action.action,
      result: mapOutcomeToAiResult(action.outcome),
      description: action.result,
      outcome: action.outcome,
    })),
    rootCause: incident.rootCause,
    finalResolution: incident.resolution,
    outcome: incident.status,
    similarityScore: score,
  };
}

export function toCurrentIncident(
  incident: Incident,
  service?: Service | null,
): CurrentIncident {
  return {
    id: incident._id,
    title: incident.title,
    description: incident.summary,
    service: incident.serviceId,
    severity: incident.severity,
    detectedAt: incident.createdAt,
    errorMessages: incident.symptoms,
    systemState: configToSystemState(
      service?.currentConfig ?? incident.historicalConfig,
    ),
  };
}

export function buildTriedAlreadySummaries(
  historical: HistoricalIncident[],
): ActionAttemptSummary[] {
  return aggregatePreviousActions(historical);
}
