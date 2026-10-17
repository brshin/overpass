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
    // remaining OMM fields used once SGP4 wiring lands
    [key: string]: unknown;
};

export type PassGeometry = {
    aos: string;
    los: string;
    max_elevation: number;
};

/**
 * Predict contact window + peak elevation from orbit elements + station.
 * TODO: replace mock window with SGP4 + elevation sweep.
 */
export function computeAosLosMaxElevation(
    _element: OrbitElement,
    _station: typeof LOS_ANGELES
): PassGeometry {
    const now = Date.now();
    // Mock: in view for the next 5 minutes so radio/pipeline can be exercised.
    return {
        aos: new Date(now - 60_000).toISOString(),
        los: new Date(now + 5 * 60_000).toISOString(),
        max_elevation: 42.5,
    };
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
