-- Apply once per database, from the project root (not inside the Next app):
--   psql overpass -f schema.sql

CREATE TABLE IF NOT EXISTS telemetry (
  time timestamptz,
  vehicle_id text,
  metric text,
  value double precision
);

CREATE INDEX IF NOT EXISTS telemetry_vehicle_metric_time
  ON telemetry (vehicle_id, metric, time);
