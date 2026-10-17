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
    max_elevation: number | "TBD";
};

/**
 * Predict contact window + peak elevation from orbit elements + station.
 * TODO: SGP4 propagate over a horizon and find AOS/LOS / max elev.
 */
export function computeAosLosMaxElevation(
    _element: OrbitElement,
    _station: typeof LOS_ANGELES
): PassGeometry {
    return {
        aos: "TBD",
        los: "TBD",
        max_elevation: "TBD",
    };
}

/** Label the window from wall clock (after geometry exists). */
export function statusFromWindow(
    aos: string,
    los: string,
    nowMs: number = Date.now()
): "upcoming" | "active" | "ended" | "TBD" {
    if (aos === "TBD" || los === "TBD") {
        return "TBD";
    }

    const aosMs = Date.parse(aos);
    const losMs = Date.parse(los);
    if (Number.isNaN(aosMs) || Number.isNaN(losMs)) {
        return "TBD";
    }

    if (nowMs < aosMs) return "upcoming";
    if (nowMs < losMs) return "active";
    return "ended";
}
