const NUMERIC_FIELDS = [
    { key: "cpuUsage", label: "CPU usage" },
    { key: "memoryUsage", label: "memory usage" },
    { key: "databaseConnectionCount", label: "database connections" },
    { key: "databaseConnectionLimit", label: "database connection limit" },
    { key: "apiLatencyMs", label: "API latency" },
    { key: "errorRate", label: "error rate" }
];
const VERSION_FIELDS = [
    { key: "deploymentVersion", label: "deployment version" },
    { key: "databaseVersion", label: "database version" },
    { key: "serviceVersion", label: "service version" },
    { key: "architecture", label: "service architecture" }
];
export function compareSystemStates(current, historical) {
    const differences = [];
    for (const field of NUMERIC_FIELDS) {
        const currentValue = current?.[field.key];
        const historicalValue = historical?.[field.key];
        if (isPresent(currentValue) && isPresent(historicalValue) && currentValue !== historicalValue) {
            differences.push({
                field: String(field.key),
                historicalValue,
                currentValue,
                summary: `${capitalize(field.label)} changed from ${String(historicalValue)} to ${String(currentValue)}`
            });
        }
    }
    for (const field of VERSION_FIELDS) {
        const currentValue = current?.[field.key];
        const historicalValue = historical?.[field.key];
        if (isPresent(currentValue) && isPresent(historicalValue) && currentValue !== historicalValue) {
            differences.push({
                field: String(field.key),
                historicalValue,
                currentValue,
                summary: `${capitalize(field.label)} changed from ${String(historicalValue)} to ${String(currentValue)}`
            });
        }
    }
    differences.push(...compareRecord("configuration", current?.configuration, historical?.configuration));
    differences.push(...compareRecord("infrastructure", current?.infrastructure, historical?.infrastructure));
    differences.push(...compareRecord("metrics", current?.metrics, historical?.metrics));
    return differences;
}
export function comparableFieldCount(current, historical) {
    if (!current || !historical) {
        return 0;
    }
    const keys = new Set([...Object.keys(flattenState(current)), ...Object.keys(flattenState(historical))]);
    let shared = 0;
    for (const key of keys) {
        if (flattenState(current)[key] !== undefined && flattenState(historical)[key] !== undefined) {
            shared += 1;
        }
    }
    return shared;
}
export function connectionRatio(state) {
    if (state?.databaseConnectionCount === undefined ||
        state.databaseConnectionLimit === undefined ||
        state.databaseConnectionLimit === 0) {
        return undefined;
    }
    return state.databaseConnectionCount / state.databaseConnectionLimit;
}
function compareRecord(prefix, current, historical) {
    if (!current || !historical) {
        return [];
    }
    const keys = new Set([...Object.keys(current), ...Object.keys(historical)]);
    const differences = [];
    for (const key of keys) {
        const currentValue = current[key];
        const historicalValue = historical[key];
        if (isPresent(currentValue) && isPresent(historicalValue) && currentValue !== historicalValue) {
            differences.push({
                field: `${prefix}.${key}`,
                historicalValue,
                currentValue,
                summary: `${capitalize(prefix)} ${key} changed from ${String(historicalValue)} to ${String(currentValue)}`
            });
        }
    }
    return differences;
}
function flattenState(state) {
    return {
        ...state,
        ...prefixRecord("configuration", state.configuration),
        ...prefixRecord("infrastructure", state.infrastructure),
        ...prefixRecord("metrics", state.metrics)
    };
}
function prefixRecord(prefix, record) {
    if (!record) {
        return {};
    }
    return Object.fromEntries(Object.entries(record).map(([key, value]) => [`${prefix}.${key}`, value]));
}
function isPresent(value) {
    return value !== undefined && value !== null && value !== "";
}
function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
export function incidentAgeDays(current, historical) {
    const currentDate = current.detectedAt ? Date.parse(current.detectedAt) : Date.now();
    const historicalDate = historical.occurredAt ? Date.parse(historical.occurredAt) : undefined;
    if (!historicalDate || Number.isNaN(currentDate) || Number.isNaN(historicalDate)) {
        return undefined;
    }
    return Math.max(0, Math.round((currentDate - historicalDate) / (1000 * 60 * 60 * 24)));
}
//# sourceMappingURL=systemStateCompare.js.map