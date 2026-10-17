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

/** Demo contact length — short so radio can be exercised without waiting on orbit. */
export const DEMO_PASS_MS = 2 * 60 * 1000;

let passes: Pass[] = [];

export function getPasses() {
    return passes;
}

async function publishPasses(unfiltered_passes: unknown[]) {
    const valid = filterValidPasses(unfiltered_passes);

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

export async function refreshPasses() {
    console.log("calls api");

    const unfiltered_passes: unknown[] = [];

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

            unfiltered_passes.push(iss_pass);

            console.log("iss", iss);
            console.log("iss_pass", iss_pass);
        }
    } catch (err) {
        console.error("celestrak fetch failed", err);
    }

    await publishPasses(unfiltered_passes);
}

/** Mock ISS window: aos=now, los=now+2m — no Celestrak. */
export async function refreshPassesDemo() {
    console.log("demo refresh");

    const now = Date.now();
    const aos = new Date(now).toISOString();
    const los = new Date(now + DEMO_PASS_MS).toISOString();
    const max_elevation = 45;
    const status = statusFromWindow(aos, los);

    const iss_pass = {
        sat: "ISS (ZARYA)",
        station: LOS_ANGELES.id,
        aos,
        los,
        max_elevation,
        status,
    };

    console.log("iss_pass (demo)", iss_pass);
    await publishPasses([iss_pass]);
}
