import { pool } from "@/lib/db";
import { filterValidPasses } from "@/lib/passValidation";

export async function POST(request: Request) {
    try {
        let body;
        try {
            body = await request.json();
        } catch {
            return Response.json({ error: "invalid JSON" }, { status: 400 });
        }

        const passes = body.passes;

        if (!Array.isArray(passes)) {
            return Response.json({ error: "invalid payload" }, { status: 400 });
        }

        const valid = filterValidPasses(passes);
        const skipped = passes.length - valid.length;

        for (const pass of valid) {
            await pool.query(
                `INSERT INTO passes (sat, station, aos, los, max_elevation, status)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (sat, station) DO UPDATE SET
                   aos = EXCLUDED.aos,
                   los = EXCLUDED.los,
                   max_elevation = EXCLUDED.max_elevation,
                   status = EXCLUDED.status`,
                [pass.sat, pass.station, pass.aos, pass.los, pass.max_elevation, pass.status]
            );
        }

        return Response.json({ upserted: valid.length, skipped }, { status: 201 });
    } catch {
        return Response.json({ error: "database unavailable" }, { status: 503 });
    }
}
