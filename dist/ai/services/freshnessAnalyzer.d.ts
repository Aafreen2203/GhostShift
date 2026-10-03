import type { LLMProvider } from "../providers/types.js";
import type { FreshnessAssessment, FreshnessStatus } from "../types/analysis.js";
import type { CurrentIncident, HistoricalIncident, SystemStateDifference } from "../types/incident.js";
export declare class FreshnessAnalyzer {
    private readonly provider;
    constructor(provider: LLMProvider);
    assessKnowledgeFreshness(currentIncident: CurrentIncident, historicalIncident: HistoricalIncident): Promise<FreshnessAssessment>;
}
export declare function determineFreshnessStatus(differences: SystemStateDifference[], comparableFields: number): FreshnessStatus;
export declare function assessKnowledgeFreshness(currentIncident: CurrentIncident, historicalIncident: HistoricalIncident, provider: LLMProvider): Promise<FreshnessAssessment>;
//# sourceMappingURL=freshnessAnalyzer.d.ts.map