import { IncidentAnalyzer } from "./services/incidentAnalyzer.js";
import { FreshnessAnalyzer } from "./services/freshnessAnalyzer.js";
import { ResolutionProcessor } from "./services/resolutionProcessor.js";
import { OpenAIProvider } from "./providers/openai.js";
import type { LLMProvider } from "./providers/types.js";
import type { CurrentIncident, HistoricalIncident } from "./types/incident.js";
import type { IncidentAnalysis, FreshnessAssessment } from "./types/analysis.js";
import type { ResolutionInput, ResolutionRecord } from "./types/resolution.js";

export type { CurrentIncident, HistoricalIncident, HistoricalAction, SystemState } from "./types/incident.js";
export type { Evidence } from "./types/evidence.js";
export type {
  IncidentAnalysis,
  FreshnessAssessment,
  ActionAttemptSummary,
  InvestigationSuggestion
} from "./types/analysis.js";
export type { ResolutionInput, ResolutionRecord } from "./types/resolution.js";
export type { LLMProvider } from "./providers/types.js";
export { OpenAIProvider } from "./providers/openai.js";
export { AIResponseError, AIConfigurationError } from "./types/errors.js";
export { aggregatePreviousActions } from "./services/actionAggregator.js";
export { rankHistoricalIncidents } from "./services/similarity.js";
export { compareSystemStates } from "./services/systemStateCompare.js";

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
