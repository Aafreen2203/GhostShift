import type { LLMProvider } from "../providers/types.js";
import type { IncidentAnalysis } from "../types/analysis.js";
import type { CurrentIncident, HistoricalIncident } from "../types/incident.js";
export declare class IncidentAnalyzer {
    private readonly provider;
    private readonly freshnessAnalyzer;
    constructor(provider: LLMProvider);
    analyzeIncident(currentIncident: CurrentIncident, historicalIncidents: HistoricalIncident[]): Promise<IncidentAnalysis>;
}
export declare function analyzeIncident(currentIncident: CurrentIncident, historicalIncidents: HistoricalIncident[], provider: LLMProvider): Promise<IncidentAnalysis>;
//# sourceMappingURL=incidentAnalyzer.d.ts.map