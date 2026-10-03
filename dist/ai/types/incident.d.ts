export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type ActionResult = "failed" | "temporary" | "successful" | "unknown";
export interface HistoricalAction {
    action: string;
    result: ActionResult;
    description?: string;
    outcome?: string;
}
export interface SystemState {
    cpuUsage?: number;
    memoryUsage?: number;
    databaseConnectionCount?: number;
    databaseConnectionLimit?: number;
    apiLatencyMs?: number;
    errorRate?: number;
    deploymentVersion?: string;
    databaseVersion?: string;
    serviceVersion?: string;
    architecture?: string;
    infrastructure?: Record<string, string | number | boolean>;
    configuration?: Record<string, string | number | boolean>;
    metrics?: Record<string, number | string | boolean>;
}
export interface IncidentSignal {
    name: string;
    value: string | number | boolean;
    observedAt?: string;
}
export interface CurrentIncident {
    id?: string;
    title?: string;
    description?: string;
    service?: string;
    severity?: IncidentSeverity;
    detectedAt?: string;
    signals?: IncidentSignal[];
    systemState?: SystemState;
    errorMessages?: string[];
    recentEvents?: string[];
}
export interface HistoricalIncident {
    id: string;
    title?: string;
    description?: string;
    service?: string;
    occurredAt?: string;
    symptoms?: string[];
    systemState?: SystemState;
    attemptedActions?: HistoricalAction[];
    rootCause?: string;
    finalResolution?: string;
    outcome?: string;
    relevantDecisions?: string[];
    tags?: string[];
    similarityScore?: number;
}
export interface SystemStateDifference {
    field: string;
    historicalValue: unknown;
    currentValue: unknown;
    summary: string;
}
//# sourceMappingURL=incident.d.ts.map