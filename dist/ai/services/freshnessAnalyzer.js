import { buildFreshnessPrompt } from "../prompts/freshness.js";
import { clampConfidence, parseLlmOutput } from "../validation/parse.js";
import { LlmFreshnessAssessmentSchema, llmFreshnessJsonSchema } from "../validation/schemas.js";
import { comparableFieldCount, compareSystemStates, incidentAgeDays } from "./systemStateCompare.js";
const SIGNIFICANT_FIELDS = new Set([
    "databaseConnectionLimit",
    "deploymentVersion",
    "databaseVersion",
    "serviceVersion",
    "architecture"
]);
export class FreshnessAnalyzer {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async assessKnowledgeFreshness(currentIncident, historicalIncident) {
        const structuredDifferences = compareSystemStates(currentIncident.systemState, historicalIncident.systemState);
        const comparableFields = comparableFieldCount(currentIncident.systemState, historicalIncident.systemState);
        const ageDays = incidentAgeDays(currentIncident, historicalIncident);
        const deterministicStatus = determineFreshnessStatus(structuredDifferences, comparableFields);
        const llm = await this.provider.generateStructuredOutput(buildFreshnessPrompt({
            currentIncident,
            historicalIncident: {
                id: historicalIncident.id,
                title: historicalIncident.title,
                occurredAt: historicalIncident.occurredAt,
                systemState: historicalIncident.systemState,
                rootCause: historicalIncident.rootCause,
                finalResolution: historicalIncident.finalResolution
            },
            differences: structuredDifferences.map((diff) => diff.summary),
            comparableFieldCount: comparableFields,
            ageDays,
            deterministicHint: deterministicStatus
        }), { name: "freshness_assessment", schema: llmFreshnessJsonSchema });
        const parsed = parseLlmOutput(LlmFreshnessAssessmentSchema, llm, "freshness assessment");
        const status = reconcileStatus(deterministicStatus, parsed.status, structuredDifferences);
        return {
            historicalIncidentId: historicalIncident.id,
            status,
            confidence: clampConfidence(parsed.confidence),
            differences: structuredDifferences.map((diff) => diff.summary),
            structuredDifferences,
            explanation: parsed.explanation,
            requiresVerification: parsed.requiresVerification || status === "potentially_outdated" || status === "conflicting",
            ageDays
        };
    }
}
export function determineFreshnessStatus(differences, comparableFields) {
    if (comparableFields === 0) {
        return "insufficient_information";
    }
    const significantChange = differences.some((diff) => SIGNIFICANT_FIELDS.has(diff.field) ||
        diff.field.startsWith("configuration.") ||
        diff.field.startsWith("infrastructure."));
    if (significantChange) {
        return "potentially_outdated";
    }
    const contradictoryMetrics = differences.some((diff) => {
        if (typeof diff.historicalValue !== "number" || typeof diff.currentValue !== "number") {
            return false;
        }
        if (diff.historicalValue === 0) {
            return false;
        }
        return Math.abs(diff.currentValue - diff.historicalValue) / Math.abs(diff.historicalValue) >= 0.75;
    });
    if (contradictoryMetrics) {
        return "conflicting";
    }
    return "relevant";
}
function reconcileStatus(deterministic, llmStatus, differences) {
    if (deterministic === "potentially_outdated" && differences.length > 0) {
        return "potentially_outdated";
    }
    if (deterministic === "insufficient_information") {
        return llmStatus === "insufficient_information" || llmStatus === "relevant"
            ? deterministic
            : llmStatus;
    }
    return llmStatus;
}
export async function assessKnowledgeFreshness(currentIncident, historicalIncident, provider) {
    return new FreshnessAnalyzer(provider).assessKnowledgeFreshness(currentIncident, historicalIncident);
}
//# sourceMappingURL=freshnessAnalyzer.js.map