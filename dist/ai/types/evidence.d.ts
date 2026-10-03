export type EvidenceSourceType = "historical_incident" | "current_signal" | "system_state" | "engineer_input";
export interface Evidence {
    sourceId: string;
    sourceType: EvidenceSourceType;
    claim: string;
    supportingData?: unknown;
}
//# sourceMappingURL=evidence.d.ts.map