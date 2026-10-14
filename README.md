# Overpass

Pass-gated satellite fleet console: telemetry and commands only while a satellite is in view of a ground station. Real orbits (public TLEs) drive contact windows; the radio link is simulated so faults and demos are repeatable.

**Status:** WIP. The repo still runs the earlier ingest → Postgres → chart slice while the product is redesigned. Stack stays Next.js, PostgreSQL, Docker.

## Stack

- Next.js (App Router, TypeScript)
- PostgreSQL 16 (Homebrew **or** Compose service `db`)
- Node simulator (`scripts/simulate.ts`) — on the host, not inside Compose
- Optional: Docker Compose (`Dockerfile` + `docker-compose.yml`)

## Setup (current slice)

**1. Install and start Postgres** (Homebrew on macOS):

```bash
brew install postgresql@16
brew services start postgresql@16
createdb overpass
```

**2. Apply the schema** from the repo root (ordinary terminal, after `createdb`):

```bash
psql overpass -f schema.sql
```

This creates the `telemetry` table and index. Safe to repeat (`IF NOT EXISTS`).

**3. Env** — project root, `.env.local` (not committed):

```
DATABASE_URL=postgresql://YOUR_MAC_USER@localhost:5432/overpass
```

Homebrew Postgres usually has no password. Restart `npm run dev` after creating this file.

If you previously used a `ground_telemetry` database, either recreate with `createdb overpass` + `psql overpass -f schema.sql`, or rename the old DB.

**4. App**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**5. Simulator** (second terminal; app must already be running):

```bash
npx tsx scripts/simulate.ts
```

Posts 3 metrics (`temp`, `bus_voltage`, `cabin_pressure`) at 1 Hz to `/api/ingest`. Ctrl+C to stop.

## Run with Docker (optional)

Compose starts `db` + `app`. Browser and simulator still use **http://localhost:3000**.

Homebrew Postgres and Compose both want port **5432**. Stop Homebrew first. Stop `npm run dev` so port **3000** is free.

```bash
brew services stop postgresql@16
docker compose up --build
```

If you had an older Compose volume created as `ground_telemetry`, reset once:

```bash
docker compose down -v
docker compose up --build
```

`schema.sql` runs **once**, when the `pgdata` volume is first created.

```bash
docker compose down
brew services start postgresql@16
```

## API (current slice)


| Method | Path             | Role                                                                                                                                                           |
| ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/health`    | Ping Postgres. 200 `{ "ok": true }` or 503 if DB is down.                                                                                                      |
| `POST` | `/api/ingest`    | Body `{ "points": [ { time, vehicle_id, metric, value } ] }`. 201 `{ "inserted": n }`. Bad batch → 400.                                                        |
| `GET`  | `/api/telemetry` | Query: `vehicle`, `metric`, `from`, `to` (ISO UTC). 200 `{ "points": [...] }` oldest first, cap 5000. Empty window is `[]`, not an error. `from` > `to` → 400. |


Metrics: `temp` \| `bus_voltage` \| `cabin_pressure`. Vehicle in the simulator: `sat-1`.

## Failure modes

- Simulator off → chart goes stale / empty; health still 200.
- Postgres off → health and ingest fail (503); page shows an error.
