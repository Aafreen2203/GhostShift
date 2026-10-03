import type { LLMProvider } from "./types.js";
export declare class OpenAIProvider implements LLMProvider {
    private readonly client;
    private readonly model;
    constructor(options?: {
        apiKey?: string;
        model?: string;
        baseURL?: string;
    });
    generateStructuredOutput<T>(prompt: string, schema: unknown): Promise<T>;
}
//# sourceMappingURL=openai.d.ts.map