import type { LLMProvider } from "../providers/types.js";
import type { CurrentIncident } from "../types/incident.js";
import type { ResolutionInput, ResolutionRecord } from "../types/resolution.js";
export declare class ResolutionProcessor {
    private readonly provider;
    constructor(provider: LLMProvider);
    processResolution(incident: CurrentIncident, resolutionInput: ResolutionInput): Promise<ResolutionRecord>;
}
export declare function processResolution(incident: CurrentIncident, resolutionInput: ResolutionInput, provider: LLMProvider): Promise<ResolutionRecord>;
//# sourceMappingURL=resolutionProcessor.d.ts.map