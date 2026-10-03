import type { ActionAttemptSummary } from "../types/analysis.js";
import type { HistoricalIncident } from "../types/incident.js";
export declare function normalizeAction(action: string): string;
export declare function actionGroupKey(action: string): string;
export declare function aggregatePreviousActions(historicalIncidents: HistoricalIncident[]): ActionAttemptSummary[];
export declare function formatActionSummary(action: string, counts: {
    totalAttempts: number;
    failed: number;
    temporary: number;
    successful: number;
    unknown: number;
}): string;
//# sourceMappingURL=actionAggregator.d.ts.map