import { SHARED_GROUNDING_RULES } from "./shared";

export function buildResolutionPrompt(payload: unknown): string {
  return `
You are GhostShift, converting an engineer's incident resolution into reusable organizational memory.

${SHARED_GROUNDING_RULES}

Task:
- Structure the engineer's input into a consistent resolution record.
- Do not invent actions, outcomes, or root causes that the engineer did not provide.
- You may rephrase for clarity, but keep meaning faithful to the input.
- Extract lessons learned and reusable knowledge only from what was supplied.
- This record will be stored as knowledge. It is not an instruction to change production.

Return JSON that matches the provided schema.

Payload:
${JSON.stringify(payload, null, 2)}
`.trim();
}
