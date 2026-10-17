import {
    degreesToRadians,
    eciToEcf,
    ecfToLookAngles,
    gstime,
    json2satrec,
    propagate,
    radiansToDegrees,
    type OMMJsonObject,
    type SatRec,
} from "satellite.js";

/** Ground station used for pass geometry (not from Celestrak). */
export const LOS_ANGELES = {
    id: "los-angeles",
    latitude: 34.05,
    longitude: -118.25,
    minElevationDeg: 10,
};

export type OrbitElement = {
    OBJECT_NAME?: string;
    NORAD_CAT_ID?: number | string;
    [key: string]: unknown;
};

export type PassGeometry = {
    aos: string;
    los: string;
    max_elevation: number;
};

const STEP_MS = 15_000;
const LOOKBACK_MS = 20 * 60_000;
const LOOKAHEAD_MS = 48 * 60 * 60_000;

function elevationDeg(
    satrec: SatRec,
    station: typeof LOS_ANGELES,
    at: Date
): number | null {
    const pv = propagate(satrec, at);
    if (pv === null) {
        return null;
    }

    const gmst = gstime(at);
    const positionEcf = eciToEcf(pv.position, gmst);
    const observerGd = {
        longitude: degreesToRadians(station.longitude),
        latitude: degreesToRadians(station.latitude),
        height: 0,
    };
    const { elevation } = ecfToLookAngles(observerGd, positionEcf);
    return radiansToDegrees(elevation);
}

/**
 * Predict the next (or current) contact window + peak elevation
 * from orbit elements + station via SGP4.
 */
export function computeAosLosMaxElevation(
    element: OrbitElement,
    station: typeof LOS_ANGELES
): PassGeometry {
    const satrec = json2satrec(element as OMMJsonObject);
    const minElev = station.minElevationDeg;
    const now = Date.now();
    const startMs = now - LOOKBACK_MS;
    const endMs = now + LOOKAHEAD_MS;

    let prevAbove: boolean | null = null;
    let aosMs: number | null = null;
    let maxElevation = -Infinity;

    for (let t = startMs; t <= endMs; t += STEP_MS) {
        const elev = elevationDeg(satrec, station, new Date(t));
        if (elev === null) {
            continue;
        }

        const above = elev >= minElev;

        if (prevAbove === null) {
            prevAbove = above;
            if (above) {
                aosMs = t;
                maxElevation = elev;
            }
            continue;
        }

        if (!prevAbove && above) {
            aosMs = t;
            maxElevation = elev;
        } else if (above && aosMs !== null) {
            if (elev > maxElevation) {
                maxElevation = elev;
            }
        } else if (prevAbove && !above && aosMs !== null) {
            const losMs = t;
            if (losMs > now) {
                return {
                    aos: new Date(aosMs).toISOString(),
                    los: new Date(losMs).toISOString(),
                    max_elevation: Math.round(maxElevation * 10) / 10,
                };
            }
            aosMs = null;
            maxElevation = -Infinity;
        }

        prevAbove = above;
    }

    throw new Error("no pass found in lookback/lookahead window");
}

/** Label the window from wall clock (after geometry exists). */
export function statusFromWindow(
    aos: string,
    los: string,
    nowMs: number = Date.now()
): "upcoming" | "active" | "ended" | "TBD" {
    const aosMs = Date.parse(aos);
    const losMs = Date.parse(los);
    if (Number.isNaN(aosMs) || Number.isNaN(losMs)) {
        return "TBD";
    }

    if (nowMs < aosMs) return "upcoming";
    if (nowMs < losMs) return "active";
    return "ended";
}
