const PASS_STATUSES = ["upcoming", "active", "ended"] as const;

export type PassStatus = (typeof PASS_STATUSES)[number];

export type Pass = {
    sat: string;
    station: string;
    aos: string;
    los: string;
    max_elevation: number;
    status: PassStatus;
};

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function isIsoTimestamp(value: unknown): value is string {
    return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

/** Same rules for worker refreshPasses and POST /api/passes. */
export function isValidPass(pass: unknown): pass is Pass {
    if (pass == null || typeof pass !== "object") {
        return false;
    }

    const p = pass as Record<string, unknown>;

    if (!isNonEmptyString(p.sat) || !isNonEmptyString(p.station)) {
        return false;
    }

    if (!isIsoTimestamp(p.aos) || !isIsoTimestamp(p.los)) {
        return false;
    }

    if (Date.parse(p.aos) >= Date.parse(p.los)) {
        return false;
    }

    if (typeof p.max_elevation !== "number" || !Number.isFinite(p.max_elevation)) {
        return false;
    }

    if (!isNonEmptyString(p.status) || !PASS_STATUSES.includes(p.status as PassStatus)) {
        return false;
    }

    return true;
}

export function filterValidPasses(passes: unknown[]): Pass[] {
    return passes.filter(isValidPass);
}
