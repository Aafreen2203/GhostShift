import { buildResolutionPrompt } from "../prompts/resolution.js";
import type { LLMProvider } from "../providers/types.js";
import type { Evidence } from "../types/evidence.js";
import type { CurrentIncident } from "../types/incident.js";
import type { LlmResolutionStructure, ResolutionActionInput, ResolutionInput, ResolutionRecord } from "../types/resolution.js";
import { parseLlmOutput } from "../validation/parse.js";
import { LlmResolutionStructureSchema, llmResolutionJsonSchema } from "../validation/schemas.js";

export class ResolutionProcessor {
  constructor(private readonly provider: LLMProvider) {}

  async processResolution(
    incident: CurrentIncident,
    resolutionInput: ResolutionInput
  ): Promise<ResolutionRecord> {
    const normalizedActions = normalizeActions(resolutionInput.actions);
    const timestamp = new Date().toISOString();

    const llm = await this.provider.generateStructuredOutput<LlmResolutionStructure>(
      buildResolutionPrompt({
        incident,
        resolutionInput: {
          ...resolutionInput,
          actions: normalizedActions
        }
      }),
      { name: "resolution_record", schema: llmResolutionJsonSchema }
    );

    const parsed = parseLlmOutput(LlmResolutionStructureSchema, llm, "resolution record");
    const actionsTaken = parsed.actionsTaken.length > 0 ? parsed.actionsTaken : normalizedActions;

    const evidence: Evidence[] = [
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

function normalizeActions(actions?: ResolutionInput["actions"]): ResolutionActionInput[] {
  if (!actions) {
    return [];
  }
  return actions.map((action) => (typeof action === "string" ? { action } : action));
}

export async function processResolution(
  incident: CurrentIncident,
  resolutionInput: ResolutionInput,
  provider: LLMProvider
): Promise<ResolutionRecord> {
  return new ResolutionProcessor(provider).processResolution(incident, resolutionInput);
}
