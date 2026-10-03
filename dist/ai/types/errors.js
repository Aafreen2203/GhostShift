export class AIResponseError extends Error {
    details;
    constructor(message, details) {
        super(message);
        this.name = "AIResponseError";
        this.details = details;
    }
}
export class AIConfigurationError extends Error {
    constructor(message) {
        super(message);
        this.name = "AIConfigurationError";
    }
}
//# sourceMappingURL=errors.js.map