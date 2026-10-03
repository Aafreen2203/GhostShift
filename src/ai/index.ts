import { IncidentAnalyzer } from "./services/incidentAnalyzer";
import { FreshnessAnalyzer } from "./services/freshnessAnalyzer";
import { ResolutionProcessor } from "./services/resolutionProcessor";
import { OpenAIProvider } from "./providers/openai";
import type { LLMProvider } from "./providers/types";
import type { CurrentIncident, HistoricalIncident } from "./types/incident";
import type { IncidentAnalysis, FreshnessAssessment } from "./types/analysis";
import type { ResolutionInput, ResolutionRecord } from "./types/resolution";

export type { CurrentIncident, HistoricalIncident, HistoricalAction, SystemState } from "./types/incident";
export type { Evidence } from "./types/evidence";
export type {
  IncidentAnalysis,
  FreshnessAssessment,
  ActionAttemptSummary,
  InvestigationSuggestion
} from "./types/analysis";
export type { ResolutionInput, ResolutionRecord } from "./types/resolution";
export type { LLMProvider } from "./providers/types";
export { OpenAIProvider } from "./providers/openai";
export { AIResponseError, AIConfigurationError } from "./types/errors";
export { aggregatePreviousActions } from "./services/actionAggregator";
export { rankHistoricalIncidents } from "./services/similarity";
export { compareSystemStates } from "./services/systemStateCompare";

export class GhostShiftAI {
  readonly incidentAnalyzer: IncidentAnalyzer;
  readonly freshnessAnalyzer: FreshnessAnalyzer;
  readonly resolutionProcessor: ResolutionProcessor;

  constructor(provider: LLMProvider) {
    this.incidentAnalyzer = new IncidentAnalyzer(provider);
    this.freshnessAnalyzer = new FreshnessAnalyzer(provider);
    this.resolutionProcessor = new ResolutionProcessor(provider);
  }

  analyzeIncident(
    currentIncident: CurrentIncident,
    historicalIncidents: HistoricalIncident[]
  ): Promise<IncidentAnalysis> {
    return this.incidentAnalyzer.analyzeIncident(currentIncident, historicalIncidents);
  }

  assessKnowledgeFreshness(
    currentIncident: CurrentIncident,
    historicalIncident: HistoricalIncident
  ): Promise<FreshnessAssessment> {
    return this.freshnessAnalyzer.assessKnowledgeFreshness(currentIncident, historicalIncident);
  }

  processResolution(incident: CurrentIncident, resolutionInput: ResolutionInput): Promise<ResolutionRecord> {
    return this.resolutionProcessor.processResolution(incident, resolutionInput);
  }
}

export function createGhostShiftAI(provider?: LLMProvider): GhostShiftAI {
  return new GhostShiftAI(provider ?? new OpenAIProvider());
}
