/** Mock passes until Celestrak + orbit math land. Shape matches SPEC pass fields. */
const MOCK_PASSES = [
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

let passes = MOCK_PASSES;

export function getPasses() {
    return passes;
}

export function refreshPasses() {
    // TODO: fetch TLEs from Celestrak, compute AOS/LOS, write passes
    console.log("calls api (mock)");
    passes = MOCK_PASSES;
    console.log("passes", passes);
}
