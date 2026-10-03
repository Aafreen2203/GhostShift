import { buildResolutionPrompt } from "../prompts/resolution.js";
import { parseLlmOutput } from "../validation/parse.js";
import { LlmResolutionStructureSchema, llmResolutionJsonSchema } from "../validation/schemas.js";
export class ResolutionProcessor {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async processResolution(incident, resolutionInput) {
        const normalizedActions = normalizeActions(resolutionInput.actions);
        const timestamp = new Date().toISOString();
        const llm = await this.provider.generateStructuredOutput(buildResolutionPrompt({
            incident,
            resolutionInput: {
                ...resolutionInput,
                actions: normalizedActions
            }
        }), { name: "resolution_record", schema: llmResolutionJsonSchema });
        const parsed = parseLlmOutput(LlmResolutionStructureSchema, llm, "resolution record");
        const actionsTaken = parsed.actionsTaken.length > 0 ? parsed.actionsTaken : normalizedActions;
        const evidence = [
            {
                sourceId: incident.id ?? "engineer-resolution",
                sourceType: "engineer_input",
                claim: "Resolution details were provided by the investigating engineer.",
                supportingData: resolutionInput
            }
        ];
        return {
            incidentId: incident.id,
            service: incident.service,
            rootCause: parsed.rootCause ?? resolutionInput.rootCause,
            actionsTaken,
            finalResolution: parsed.finalResolution ?? resolutionInput.finalResolution,
            outcome: parsed.outcome ?? resolutionInput.outcome,
            evidence,
            lessonsLearned: parsed.lessonsLearned,
            reusableKnowledge: parsed.reusableKnowledge,
            timestamp
        };
    }
}
function normalizeActions(actions) {
    if (!actions) {
        return [];
    }
    return actions.map((action) => (typeof action === "string" ? { action } : action));
}
export async function processResolution(incident, resolutionInput, provider) {
    return new ResolutionProcessor(provider).processResolution(incident, resolutionInput);
}
//# sourceMappingURL=resolutionProcessor.js.map