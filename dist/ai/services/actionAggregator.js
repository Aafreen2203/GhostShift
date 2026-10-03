const VERB_MAP = {
    restarted: "restart",
    restarting: "restart",
    increased: "increase",
    increasing: "increase",
    decreased: "decrease",
    decreasing: "decrease",
    cleared: "clear",
    clearing: "clear",
    scaled: "scale",
    scaling: "scale",
    rolled: "roll",
    rolling: "roll"
};
export function normalizeAction(action) {
    return action
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token && !["the", "a", "an", "to", "of"].includes(token))
        .map((token) => VERB_MAP[token] ?? token)
        .join(" ")
        .trim();
}
export function actionGroupKey(action) {
    const normalized = normalizeAction(action);
    const tokens = normalized.split(" ").filter(Boolean);
    if (tokens.length <= 2) {
        return normalized;
    }
    const first = tokens[0];
    const last = tokens[tokens.length - 1];
    return first && last ? `${first} ${last}` : normalized;
}
function sameActionFamily(left, right) {
    if (left === right) {
        return true;
    }
    const leftTokens = left.split(" ").filter(Boolean);
    const rightTokens = right.split(" ").filter(Boolean);
    const smaller = leftTokens.length <= rightTokens.length ? leftTokens : rightTokens;
    const larger = leftTokens.length <= rightTokens.length ? rightTokens : leftTokens;
    return smaller.length >= 2 && smaller.every((token) => larger.includes(token));
}
export function aggregatePreviousActions(historicalIncidents) {
    const groups = [];
    for (const incident of historicalIncidents) {
        for (const attempted of incident.attemptedActions ?? []) {
            const key = actionGroupKey(attempted.action);
            if (!key) {
                continue;
            }
            const result = attempted.result ?? "unknown";
            const match = groups.find((group) => sameActionFamily(group.action, key));
            if (match) {
                match[result] += 1;
                match.incidentIds.add(incident.id);
                if (key.length < match.action.length) {
                    match.action = key;
                }
            }
            else {
                groups.push({
                    action: key,
                    failed: 0,
                    temporary: 0,
                    successful: 0,
                    unknown: 0,
                    incidentIds: new Set([incident.id]),
                    [result]: 1
                });
            }
        }
    }
    return groups
        .map((group) => {
        const totalAttempts = group.failed + group.temporary + group.successful + group.unknown;
        return {
            action: group.action,
            totalAttempts,
            failed: group.failed,
            temporary: group.temporary,
            successful: group.successful,
            unknown: group.unknown,
            incidentIds: [...group.incidentIds],
            summary: formatActionSummary(group.action, {
                totalAttempts,
                failed: group.failed,
                temporary: group.temporary,
                successful: group.successful,
                unknown: group.unknown
            })
        };
    })
        .sort((a, b) => b.totalAttempts - a.totalAttempts);
}
export function formatActionSummary(action, counts) {
    return [
        `This action (${action}) has been attempted in ${counts.totalAttempts} similar incident action(s).`,
        `Temporary recovery: ${counts.temporary}`,
        `Permanent resolution: ${counts.successful}`,
        `No effect / failed: ${counts.failed}`,
        `Unknown: ${counts.unknown}`
    ].join(" ");
}
//# sourceMappingURL=actionAggregator.js.map