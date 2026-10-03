import type { SystemStateDifference, CurrentIncident, HistoricalIncident, SystemState } from "../types/incident.js";
export declare function compareSystemStates(current?: SystemState, historical?: SystemState): SystemStateDifference[];
export declare function comparableFieldCount(current?: SystemState, historical?: SystemState): number;
export declare function connectionRatio(state?: SystemState): number | undefined;
export declare function incidentAgeDays(current: CurrentIncident, historical: HistoricalIncident): number | undefined;
//# sourceMappingURL=systemStateCompare.d.ts.map