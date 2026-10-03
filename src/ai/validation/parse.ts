import { z, type ZodType } from "zod";
import { AIResponseError } from "../types/errors";

export function parseLlmOutput<T>(schema: ZodType<T>, value: unknown, context: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    console.error(`[ghostshift] malformed ${context}`, {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
    throw new AIResponseError(`Malformed ${context} from LLM`, {
      issues: result.error.flatten()
    });
  }
  return result.data;
}

export function clampConfidence(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

export { z };
