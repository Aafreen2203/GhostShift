import { z, type ZodType } from "zod";
export declare function parseLlmOutput<T>(schema: ZodType<T>, value: unknown, context: string): T;
export declare function clampConfidence(value: number): number;
export { z };
//# sourceMappingURL=parse.d.ts.map