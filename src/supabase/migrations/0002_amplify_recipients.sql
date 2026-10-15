-- =============================================================================
-- 0002_amplify_recipients.sql
-- Targeting foundation for the Amplify broadcast ("the other half" of Amplify:
-- which musicians receive a pushed gig).
--
-- Additive and idempotent: safe to run on top of schema.sql + 0001 repeatedly.
-- This migration is the source of the structural change; schema.sql remains the
-- consolidated current state.
--
-- Adds:
--   * musician_profiles.latitude / longitude (double precision, nullable) — the
--     musician's home location, used as the proximity origin for Amplify.
--   * musician_profiles.location geography(Point, 4326), kept in sync with
--     latitude/longitude via a BEFORE INSERT/UPDATE trigger (mirrors the gigs
--     pattern in 0001 and the client's isValidCoordinate semantics).
--   * GIST index on musician_profiles.location (accelerates ST_DWithin).
--   * GIN index on musician_profiles.genres (accelerates && genre overlap).
--   * amplify_recipients(...) RPC (SECURITY INVOKER): given a gig id, radius in
--     miles, and a genre-match flag, returns the musician ids within radius
--     (optionally sharing a genre), each with distance_miles — nearest first.
--
-- RLS: unchanged and respected. amplify_recipients is SECURITY INVOKER and reads
-- only `gigs` (SELECT allowed to any authenticated user) and `musician_profiles`
-- (SELECT allowed to any authenticated user). The RPC therefore returns nothing
-- the caller could not read directly. No new policy is required.
--
-- Units: the app speaks MILES; the database speaks METERS. Conversion happens
-- only at this SQL boundary (miles * 1609.344).
-- =============================================================================

-- PostGIS is enabled by 0001; this guard makes 0002 safe to run standalone.
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Musician home coordinates + spatial column. --------------------------------
ALTER TABLE musician_profiles
  ADD COLUMN IF NOT EXISTS latitude  double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS location  geography(Point, 4326);

-- 2. Keep location in sync with latitude/longitude. -----------------------------
--    Null, zero, or out-of-range coords => NULL location (mirrors the client's
--    isValidCoordinate: lat === 0 || lng === 0, or out of range, means "no
--    location", and such a musician is never an Amplify recipient).
CREATE OR REPLACE FUNCTION musician_profiles_sync_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL
     OR NEW.latitude = 0 OR NEW.longitude = 0
     OR NEW.latitude < -90 OR NEW.latitude > 90
     OR NEW.longitude < -180 OR NEW.longitude > 180 THEN
    NEW.location := NULL;
  ELSE
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS musician_profiles_sync_location_trg ON musician_profiles;
CREATE TRIGGER musician_profiles_sync_location_trg
  BEFORE INSERT OR UPDATE OF latitude, longitude ON musician_profiles
  FOR EACH ROW
  EXECUTE FUNCTION musician_profiles_sync_location();

-- Backfill existing rows (idempotent — recomputes location from lat/lng).
UPDATE musician_profiles
   SET location = CASE
     WHEN latitude IS NULL OR longitude IS NULL
          OR latitude = 0 OR longitude = 0
          OR latitude < -90 OR latitude > 90
          OR longitude < -180 OR longitude > 180 THEN NULL
     ELSE ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
   END;

-- 3. Indexes. -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_musician_profiles_location
  ON musician_profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_musician_profiles_genres
  ON musician_profiles USING GIN (genres);

-- 4. amplify_recipients RPC. ----------------------------------------------------
--    SECURITY INVOKER so the caller's RLS still applies. Given a gig and a
--    radius, returns the musicians who should receive the amplified push:
--      * within p_radius_miles of the gig (inclusive, ST_DWithin);
--      * excluding the gig's own hoster;
--      * excluding musicians with no location (NULL `location`);
--      * when p_match_genres is true AND the gig lists genres, only musicians
--        sharing at least one genre (&& overlap).
--    Sorted nearest-first, tie-broken by musician id for determinism. Mirrors
--    the pure getPushRecipients() in src/data/amplifyService.ts exactly.
CREATE OR REPLACE FUNCTION amplify_recipients(
  p_gig_id        uuid,
  p_radius_miles  double precision,
  p_match_genres  boolean DEFAULT true
)
RETURNS TABLE (
  musician_id    uuid,
  distance_miles double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH gig AS (
    SELECT g.id, g.hoster_id, g.location, g.genres
    FROM gigs g
    WHERE g.id = p_gig_id
  )
  SELECT
    mp.id AS musician_id,
    ST_Distance(mp.location, gig.location) / 1609.344 AS distance_miles
  FROM musician_profiles mp
  CROSS JOIN gig
  WHERE gig.location IS NOT NULL          -- gig must have a location to broadcast
    AND mp.location IS NOT NULL           -- musician must have a location
    AND mp.id <> gig.hoster_id            -- never push back to the hoster
    AND p_radius_miles > 0
    -- radius (inclusive): miles -> meters
    AND ST_DWithin(mp.location, gig.location, p_radius_miles * 1609.344)
    -- genre overlap, only when requested and the gig actually lists genres
    AND (
      p_match_genres IS NOT TRUE
      OR gig.genres IS NULL
      OR cardinality(gig.genres) = 0
      OR mp.genres && gig.genres
    )
  ORDER BY ST_Distance(mp.location, gig.location) ASC, mp.id ASC;
$$;
