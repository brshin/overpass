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

CREATE TABLE IF NOT EXISTS passes (
  sat text,
  station text,
  aos timestamptz,
  los timestamptz,
  max_elevation double precision,
  status text
);
