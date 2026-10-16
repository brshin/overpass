import { getPasses } from "./passes";

const INGEST_URL = "http://localhost:3000/api/ingest";

export function radio() {
    const now = Date.now();
    const time = new Date(now).toISOString();

    for (const pass of getPasses()) {
        const aos = Date.parse(pass.aos);
        const los = Date.parse(pass.los);

        if (aos <= now && now < los) {
            const points = [
                { time, vehicle_id: pass.sat, metric: "temp", value: 22 + (Math.random() - 0.5) },
                { time, vehicle_id: pass.sat, metric: "bus_voltage", value: 28 + (Math.random() - 0.5) },
                {
                    time,
                    vehicle_id: pass.sat,
                    metric: "cabin_pressure",
                    value: 14.7 + (Math.random() - 0.5) * 0.5,
                },
            ];

            fetch(INGEST_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ points }),
            })
                .then(async (res) => {
                    const body = await res.json();
                    console.log(res.status, body);
                })
                .catch((err) => {
                    console.error("ingest failed", err);
                });
        }
    }
}
