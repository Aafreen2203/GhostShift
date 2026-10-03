import type { CurrentIncident, HistoricalIncident } from "../types/incident.js";
export interface RankedIncident {
    incident: HistoricalIncident;
    similarityScore: number;
}
export declare function rankHistoricalIncidents(current: CurrentIncident, historicalIncidents: HistoricalIncident[]): RankedIncident[];
export declare function scoreSimilarity(current: CurrentIncident, historical: HistoricalIncident): number;
//# sourceMappingURL=similarity.d.ts.map