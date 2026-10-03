import OpenAI from "openai";
import { AIConfigurationError, AIResponseError } from "../types/errors.js";
function jsonSchemaName(schema) {
    if (schema && typeof schema === "object" && "name" in schema) {
        const name = schema.name;
        if (typeof name === "string" && name.length > 0) {
            return name;
        }
    }
    return "ghostshift_output";
}
function jsonSchemaBody(schema) {
    if (schema && typeof schema === "object" && "schema" in schema) {
        return schema.schema;
    }
    if (schema && typeof schema === "object") {
        return schema;
    }
    throw new AIConfigurationError("Structured output schema must be a JSON schema object");
}
export class OpenAIProvider {
    client;
    model;
    constructor(options) {
        const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new AIConfigurationError("OPENAI_API_KEY is not set");
        }
        this.model = options?.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
        this.client = new OpenAI({
            apiKey,
            baseURL: options?.baseURL ?? process.env.OPENAI_BASE_URL
        });
    }
    async generateStructuredOutput(prompt, schema) {
        const name = jsonSchemaName(schema);
        const body = jsonSchemaBody(schema);
        let raw;
        try {
            const completion = await this.client.chat.completions.create({
                model: this.model,
                temperature: 0,
                messages: [
                    {
                        role: "system",
                        content: "You are a server-side analysis engine. Return only valid JSON that matches the schema. Never include secrets."
                    },
                    { role: "user", content: prompt }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name,
                        strict: true,
                        schema: body
                    }
                }
            });
            raw = completion.choices[0]?.message?.content;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "OpenAI request failed";
            console.error("[ghostshift] OpenAI request failed", { message });
            throw new AIResponseError("LLM provider request failed", { message });
        }
        if (!raw) {
            console.error("[ghostshift] OpenAI returned an empty response");
            throw new AIResponseError("LLM provider returned an empty response");
        }
        try {
            return JSON.parse(raw);
        }
        catch {
            console.error("[ghostshift] OpenAI returned malformed JSON");
            throw new AIResponseError("LLM provider returned malformed JSON");
        }
    }
}
//# sourceMappingURL=openai.js.map