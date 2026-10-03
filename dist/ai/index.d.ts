import { IncidentAnalyzer } from "./services/incidentAnalyzer.js";
import { FreshnessAnalyzer } from "./services/freshnessAnalyzer.js";
import { ResolutionProcessor } from "./services/resolutionProcessor.js";
import type { LLMProvider } from "./providers/types.js";
import type { CurrentIncident, HistoricalIncident } from "./types/incident.js";
import type { IncidentAnalysis, FreshnessAssessment } from "./types/analysis.js";
import type { ResolutionInput, ResolutionRecord } from "./types/resolution.js";
export type { CurrentIncident, HistoricalIncident, HistoricalAction, SystemState } from "./types/incident.js";
export type { Evidence } from "./types/evidence.js";
export type { IncidentAnalysis, FreshnessAssessment, ActionAttemptSummary, InvestigationSuggestion } from "./types/analysis.js";
export type { ResolutionInput, ResolutionRecord } from "./types/resolution.js";
export type { LLMProvider } from "./providers/types.js";
export { OpenAIProvider } from "./providers/openai.js";
export { AIResponseError, AIConfigurationError } from "./types/errors.js";
export { aggregatePreviousActions } from "./services/actionAggregator.js";
export { rankHistoricalIncidents } from "./services/similarity.js";
export { compareSystemStates } from "./services/systemStateCompare.js";
export declare class GhostShiftAI {
    readonly incidentAnalyzer: IncidentAnalyzer;
    readonly freshnessAnalyzer: FreshnessAnalyzer;
    readonly resolutionProcessor: ResolutionProcessor;
    constructor(provider: LLMProvider);
    analyzeIncident(currentIncident: CurrentIncident, historicalIncidents: HistoricalIncident[]): Promise<IncidentAnalysis>;
    assessKnowledgeFreshness(currentIncident: CurrentIncident, historicalIncident: HistoricalIncident): Promise<FreshnessAssessment>;
    processResolution(incident: CurrentIncident, resolutionInput: ResolutionInput): Promise<ResolutionRecord>;
}
export declare function createGhostShiftAI(provider?: LLMProvider): GhostShiftAI;
//# sourceMappingURL=index.d.ts.map