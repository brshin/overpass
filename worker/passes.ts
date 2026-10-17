import { filterValidPasses, type Pass } from "../lib/passValidation";
import {
    computeAosLosMaxElevation,
    LOS_ANGELES,
    statusFromWindow,
    type OrbitElement,
} from "./computePass";

const PASSES_URL = "http://localhost:3000/api/passes";
const ISS_GP_URL =
    "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=JSON";

/** Mock passes until Celestrak + orbit math land. Shape matches SPEC pass fields. */
const MOCK_PASSES: Pass[] = [
    {
        sat: "sat-1",
        station: "los-angeles",
        aos: "2026-10-16T00:01:00.000Z",
        los: "2026-10-16T00:05:00.000Z",
        max_elevation: 42.5,
        status: "upcoming",
    },
    {
        sat: "sat-1",
        station: "los-angeles",
        aos: "2026-10-16T01:40:00.000Z",
        los: "2026-10-16T01:48:00.000Z",
        max_elevation: 18.2,
        status: "upcoming",
    },
];

let passes: Pass[] = [];

export function getPasses() {
    return passes;
}

export async function refreshPasses() {
    console.log("calls api");

    try {
        const res = await fetch(ISS_GP_URL);
        if (!res.ok) {
            console.error("celestrak fetch failed", res.status);
        } else {
            const iss = await res.json();
            const element = (Array.isArray(iss) ? iss[0] : iss) as OrbitElement;

            const { aos, los, max_elevation } = computeAosLosMaxElevation(
                element,
                LOS_ANGELES
            );
            const status = statusFromWindow(aos, los);

            const iss_pass = {
                sat: element?.OBJECT_NAME ?? String(element?.NORAD_CAT_ID ?? "25544"),
                station: LOS_ANGELES.id,
                aos,
                los,
                max_elevation,
                status,
            };

            console.log("iss", iss);
            console.log("iss_pass", iss_pass);
        }
    } catch (err) {
        console.error("celestrak fetch failed", err);
    }

    // Still publish mock windows until orbit → AOS/LOS math exists (TBD fields won't validate).
    const valid = filterValidPasses(MOCK_PASSES);

    try {
        const res = await fetch(PASSES_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ passes: valid }),
        });
        const body = await res.json();
        console.log(res.status, body);
        if (!res.ok) {
            console.error("passes ingest rejected; in-memory unchanged");
            return;
        }
        passes = valid;
        console.log("passes", passes);
    } catch (err) {
        console.error("passes ingest failed; in-memory unchanged", err);
    }
}
