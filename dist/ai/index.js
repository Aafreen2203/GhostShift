import { IncidentAnalyzer } from "./services/incidentAnalyzer.js";
import { FreshnessAnalyzer } from "./services/freshnessAnalyzer.js";
import { ResolutionProcessor } from "./services/resolutionProcessor.js";
import { OpenAIProvider } from "./providers/openai.js";
export { OpenAIProvider } from "./providers/openai.js";
export { AIResponseError, AIConfigurationError } from "./types/errors.js";
export { aggregatePreviousActions } from "./services/actionAggregator.js";
export { rankHistoricalIncidents } from "./services/similarity.js";
export { compareSystemStates } from "./services/systemStateCompare.js";
export class GhostShiftAI {
    incidentAnalyzer;
    freshnessAnalyzer;
    resolutionProcessor;
    constructor(provider) {
        this.incidentAnalyzer = new IncidentAnalyzer(provider);
        this.freshnessAnalyzer = new FreshnessAnalyzer(provider);
        this.resolutionProcessor = new ResolutionProcessor(provider);
    }
    analyzeIncident(currentIncident, historicalIncidents) {
        return this.incidentAnalyzer.analyzeIncident(currentIncident, historicalIncidents);
    }
    assessKnowledgeFreshness(currentIncident, historicalIncident) {
        return this.freshnessAnalyzer.assessKnowledgeFreshness(currentIncident, historicalIncident);
    }
    processResolution(incident, resolutionInput) {
        return this.resolutionProcessor.processResolution(incident, resolutionInput);
    }
}
export function createGhostShiftAI(provider) {
    return new GhostShiftAI(provider ?? new OpenAIProvider());
}
//# sourceMappingURL=index.js.map