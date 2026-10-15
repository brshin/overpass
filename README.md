# Overpass

Pass-gated satellite fleet console: telemetry and commands only while a satellite is in view of a ground station. Real orbits (public TLEs) drive contact windows; the radio link is simulated so faults and demos are repeatable.

**Status:** WIP. The repo still runs the earlier ingest → Postgres → chart slice while the product is redesigned. Stack stays Next.js, PostgreSQL, Docker.

## Stack

- Next.js (App Router, TypeScript)
- PostgreSQL 16 (Compose service `db`; Homebrew still optional for host-only runs)
- Node simulator (`scripts/simulate.ts`) — on the host, not inside Compose
- Docker Compose: **dev** (live reload) by default; **prod** image via `docker-compose.prod.yml`

## Setup (Docker — recommended)

Compose starts Postgres + the Next.js app with a bind mount so edits on your Mac reload in the container (`next dev`). Browser and simulator use **http://localhost:3000**.

Homebrew Postgres and Compose both want port **5432**. Stop Homebrew first if it is running. Free port **3000** if something else is using it.

```bash
brew services stop postgresql@16   # if needed
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). After changing `package.json` / lockfile, reinstall inside the app container:

```bash
docker compose exec app npm ci
```

If you had an older Compose volume created as `ground_telemetry`, reset once:

```bash
docker compose down -v
docker compose up --build
```

`schema.sql` runs **once**, when the `pgdata` volume is first created.

**Production-style image** (no bind mount; rebuild to pick up code changes):

```bash
docker compose -f docker-compose.prod.yml up --build
```

Stop:

```bash
docker compose down
```

### Simulator (host)

App must already be running (Compose or otherwise):

```bash
npx tsx scripts/simulate.ts
```

Posts 3 metrics (`temp`, `bus_voltage`, `cabin_pressure`) at 1 Hz to `/api/ingest`. Ctrl+C to stop. Needs Node on the host (or run the same command via `docker compose exec app …` if you prefer).

## Setup (host-only, optional)

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
