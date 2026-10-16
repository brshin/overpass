import { filterValidPasses, type Pass } from "../lib/passValidation";

const PASSES_URL = "http://localhost:3000/api/passes";

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

export function refreshPasses() {
    // TODO: fetch TLEs from Celestrak, compute AOS/LOS, write passes
    console.log("calls api (mock)");

    const valid = filterValidPasses(MOCK_PASSES);

    fetch(PASSES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passes: valid }),
    })
        .then(async (res) => {
            const body = await res.json();
            console.log(res.status, body);
            if (!res.ok) {
                console.error("passes ingest rejected; in-memory unchanged");
                return;
            }
            passes = valid;
            console.log("passes", passes);
        })
        .catch((err) => {
            console.error("passes ingest failed; in-memory unchanged", err);
        });
}
