import { z } from "zod";
export declare const EvidenceSourceTypeSchema: z.ZodEnum<["historical_incident", "current_signal", "system_state", "engineer_input"]>;
export declare const LlmIncidentAnalysisSchema: z.ZodObject<{
    summary: z.ZodString;
    similarIncidents: z.ZodArray<z.ZodObject<{
        incidentId: z.ZodString;
        whyRelevant: z.ZodString;
        whatHappened: z.ZodString;
        whatWasAttempted: z.ZodString;
        whatEventuallyWorked: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        incidentId: string;
        whyRelevant: string;
        whatHappened: string;
        whatWasAttempted: string;
        whatEventuallyWorked?: string | undefined;
    }, {
        incidentId: string;
        whyRelevant: string;
        whatHappened: string;
        whatWasAttempted: string;
        whatEventuallyWorked?: string | undefined;
    }>, "many">;
    conflicts: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        evidenceSourceIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string;
        evidenceSourceIds: string[];
    }, {
        description: string;
        evidenceSourceIds: string[];
    }>, "many">;
    suggestedInvestigation: z.ZodObject<{
        suggestion: z.ZodString;
        reason: z.ZodString;
        evidenceSourceIds: z.ZodArray<z.ZodString, "many">;
        insufficientEvidence: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        evidenceSourceIds: string[];
        suggestion: string;
        reason: string;
        insufficientEvidence: boolean;
    }, {
        evidenceSourceIds: string[];
        suggestion: string;
        reason: string;
        insufficientEvidence: boolean;
    }>;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    summary: string;
    similarIncidents: {
        incidentId: string;
        whyRelevant: string;
        whatHappened: string;
        whatWasAttempted: string;
        whatEventuallyWorked?: string | undefined;
    }[];
    conflicts: {
        description: string;
        evidenceSourceIds: string[];
    }[];
    suggestedInvestigation: {
        evidenceSourceIds: string[];
        suggestion: string;
        reason: string;
        insufficientEvidence: boolean;
    };
    confidence: number;
}, {
    summary: string;
    similarIncidents: {
        incidentId: string;
        whyRelevant: string;
        whatHappened: string;
        whatWasAttempted: string;
        whatEventuallyWorked?: string | undefined;
    }[];
    conflicts: {
        description: string;
        evidenceSourceIds: string[];
    }[];
    suggestedInvestigation: {
        evidenceSourceIds: string[];
        suggestion: string;
        reason: string;
        insufficientEvidence: boolean;
    };
    confidence: number;
}>;
export declare const LlmFreshnessAssessmentSchema: z.ZodObject<{
    status: z.ZodEnum<["relevant", "potentially_outdated", "conflicting", "insufficient_information"]>;
    confidence: z.ZodNumber;
    explanation: z.ZodString;
    requiresVerification: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    status: "relevant" | "potentially_outdated" | "conflicting" | "insufficient_information";
    confidence: number;
    explanation: string;
    requiresVerification: boolean;
}, {
    status: "relevant" | "potentially_outdated" | "conflicting" | "insufficient_information";
    confidence: number;
    explanation: string;
    requiresVerification: boolean;
}>;
export declare const ResolutionActionInputSchema: z.ZodObject<{
    action: z.ZodString;
    result: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: string;
    description?: string | undefined;
    result?: string | undefined;
}, {
    action: string;
    description?: string | undefined;
    result?: string | undefined;
}>;
export declare const LlmResolutionStructureSchema: z.ZodObject<{
    rootCause: z.ZodOptional<z.ZodString>;
    actionsTaken: z.ZodArray<z.ZodObject<{
        action: z.ZodString;
        result: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action: string;
        description?: string | undefined;
        result?: string | undefined;
    }, {
        action: string;
        description?: string | undefined;
        result?: string | undefined;
    }>, "many">;
    finalResolution: z.ZodOptional<z.ZodString>;
    outcome: z.ZodOptional<z.ZodString>;
    lessonsLearned: z.ZodArray<z.ZodString, "many">;
    reusableKnowledge: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    actionsTaken: {
        action: string;
        description?: string | undefined;
        result?: string | undefined;
    }[];
    lessonsLearned: string[];
    reusableKnowledge: string[];
    rootCause?: string | undefined;
    finalResolution?: string | undefined;
    outcome?: string | undefined;
}, {
    actionsTaken: {
        action: string;
        description?: string | undefined;
        result?: string | undefined;
    }[];
    lessonsLearned: string[];
    reusableKnowledge: string[];
    rootCause?: string | undefined;
    finalResolution?: string | undefined;
    outcome?: string | undefined;
}>;
export declare const llmIncidentAnalysisJsonSchema: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["summary", "similarIncidents", "conflicts", "suggestedInvestigation", "confidence"];
    readonly properties: {
        readonly summary: {
            readonly type: "string";
        };
        readonly similarIncidents: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["incidentId", "whyRelevant", "whatHappened", "whatWasAttempted"];
                readonly properties: {
                    readonly incidentId: {
                        readonly type: "string";
                    };
                    readonly whyRelevant: {
                        readonly type: "string";
                    };
                    readonly whatHappened: {
                        readonly type: "string";
                    };
                    readonly whatWasAttempted: {
                        readonly type: "string";
                    };
                    readonly whatEventuallyWorked: {
                        readonly type: "string";
                    };
                };
            };
        };
        readonly conflicts: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["description", "evidenceSourceIds"];
                readonly properties: {
                    readonly description: {
                        readonly type: "string";
                    };
                    readonly evidenceSourceIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
            };
        };
        readonly suggestedInvestigation: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["suggestion", "reason", "evidenceSourceIds", "insufficientEvidence"];
            readonly properties: {
                readonly suggestion: {
                    readonly type: "string";
                };
                readonly reason: {
                    readonly type: "string";
                };
                readonly evidenceSourceIds: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly insufficientEvidence: {
                    readonly type: "boolean";
                };
            };
        };
        readonly confidence: {
            readonly type: "number";
        };
    };
};
export declare const llmFreshnessJsonSchema: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["status", "confidence", "explanation", "requiresVerification"];
    readonly properties: {
        readonly status: {
            readonly type: "string";
            readonly enum: readonly ["relevant", "potentially_outdated", "conflicting", "insufficient_information"];
        };
        readonly confidence: {
            readonly type: "number";
        };
        readonly explanation: {
            readonly type: "string";
        };
        readonly requiresVerification: {
            readonly type: "boolean";
        };
    };
};
export declare const llmResolutionJsonSchema: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["actionsTaken", "lessonsLearned", "reusableKnowledge"];
    readonly properties: {
        readonly rootCause: {
            readonly type: "string";
        };
        readonly actionsTaken: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["action"];
                readonly properties: {
                    readonly action: {
                        readonly type: "string";
                    };
                    readonly result: {
                        readonly type: "string";
                    };
                    readonly description: {
                        readonly type: "string";
                    };
                };
            };
        };
        readonly finalResolution: {
            readonly type: "string";
        };
        readonly outcome: {
            readonly type: "string";
        };
        readonly lessonsLearned: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly reusableKnowledge: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
    };
};
//# sourceMappingURL=schemas.d.ts.map