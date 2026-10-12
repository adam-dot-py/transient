-- =============================================================================
-- 0001_gig_search_postgis.sql
-- Spatial foundation for gig search + the search_gigs RPC.
--
-- Additive and idempotent: safe to run on top of the base schema (schema.sql)
-- repeatedly. This migration is the source of the structural change; schema.sql
-- remains the consolidated current state.
--
-- Adds:
--   * PostGIS extension (enabled once).
--   * gigs.location geography(Point, 4326), kept in sync with latitude/longitude
--     via a BEFORE INSERT/UPDATE trigger (mirrors isValidCoordinate semantics).
--   * GIST index on gigs.location (accelerates ST_DWithin / ST_Distance).
--   * GIN index on gigs.genres (accelerates the && array-overlap predicate).
--   * search_gigs(...) RPC (SECURITY INVOKER) filtering by text/genres/pay/radius
--     and sorting (distance / pay / date), returning gig columns + distance_miles.
--
-- RLS: unchanged. search_gigs is SECURITY INVOKER and reads only `gigs`, whose
-- existing SELECT policy ("Authenticated users can read available gigs") already
-- lets any authenticated user read gig rows. The RPC therefore returns nothing
-- the caller could not read directly. No new policy is required.
--
-- Units: the app speaks MILES; the database speaks METERS. Conversion happens
-- only at this SQL boundary (miles * 1609.344).
-- =============================================================================

-- 1. Enable PostGIS once. --------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Real spatial column on gigs (SRID 4326 / WGS84). ---------------------------
--    Nullable: rows with no/zero/out-of-range coordinates simply have a NULL
--    location and are excluded from radius results.
ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- 3. Keep location in sync with latitude/longitude. -----------------------------
--    Zero, null, or out-of-range coords => NULL location (mirrors the client's
--    isValidCoordinate: lat === 0 || lng === 0, or out of range, means "no
--    location"). Longitude is the X ordinate, latitude the Y ordinate.
CREATE OR REPLACE FUNCTION gigs_sync_location()
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

DROP TRIGGER IF EXISTS gigs_sync_location_trg ON gigs;
CREATE TRIGGER gigs_sync_location_trg
  BEFORE INSERT OR UPDATE OF latitude, longitude ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION gigs_sync_location();

-- Backfill existing rows (idempotent — recomputes location from lat/lng).
UPDATE gigs
   SET location = CASE
     WHEN latitude = 0 OR longitude = 0
          OR latitude < -90 OR latitude > 90
          OR longitude < -180 OR longitude > 180 THEN NULL
     ELSE ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
   END;

-- 4. Indexes. -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gigs_location ON gigs USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_gigs_genres   ON gigs USING GIN (genres);

-- 5. search_gigs RPC. -----------------------------------------------------------
--    SECURITY INVOKER so the caller's RLS still applies. Returns the full gig
--    row shape (matching GigRow in src/supabase/types.ts) plus distance_miles.
CREATE OR REPLACE FUNCTION search_gigs(
  p_user_lat            double precision,
  p_user_lng            double precision,
  p_query               text    DEFAULT NULL,
  p_genres              text[]  DEFAULT NULL,
  p_min_pay             integer DEFAULT NULL,
  p_max_pay             integer DEFAULT NULL,
  p_max_distance_miles  double precision DEFAULT NULL,
  p_sort_by             text    DEFAULT 'distance'
)
RETURNS TABLE (
  id uuid, hoster_id uuid, title text, description text, venue_name text,
  address_line1 text, address_line2 text, city text, postcode text, country text,
  latitude double precision, longitude double precision, date date,
  start_time time, end_time time, genres text[], pay integer, status text,
  push_enabled boolean, accepted_musician_ids uuid[],
  created_at timestamptz, updated_at timestamptz,
  distance_miles double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH origin AS (
    SELECT ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography AS pt
  )
  SELECT
    g.id, g.hoster_id, g.title, g.description, g.venue_name,
    g.address_line1, g.address_line2, g.city, g.postcode, g.country,
    g.latitude, g.longitude, g.date, g.start_time, g.end_time, g.genres,
    g.pay, g.status, g.push_enabled, g.accepted_musician_ids,
    g.created_at, g.updated_at,
    -- distance in MILES (meters / 1609.344); NULL when the gig has no location.
    CASE WHEN g.location IS NULL THEN NULL
         ELSE ST_Distance(g.location, o.pt) / 1609.344
    END AS distance_miles
  FROM gigs g CROSS JOIN origin o
  WHERE g.status = 'available'
    -- text (case-insensitive) over title / venue_name / city
    AND (p_query IS NULL OR
         (g.title ILIKE '%' || p_query || '%'
          OR g.venue_name ILIKE '%' || p_query || '%'
          OR g.city ILIKE '%' || p_query || '%'))
    -- genre overlap (any selected genre present on the gig)
    AND (p_genres IS NULL OR g.genres && p_genres)
    -- pay range (inclusive)
    AND (p_min_pay IS NULL OR g.pay >= p_min_pay)
    AND (p_max_pay IS NULL OR g.pay <= p_max_pay)
    -- radius (inclusive): miles -> meters; excludes NULL-location rows
    AND (p_max_distance_miles IS NULL OR
         (g.location IS NOT NULL
          AND ST_DWithin(g.location, o.pt, p_max_distance_miles * 1609.344)))
  ORDER BY
    -- distance sort: known distances ascending, NULL (no location) last
    CASE WHEN p_sort_by = 'distance'     THEN ST_Distance(g.location, o.pt) END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'payHighToLow' THEN g.pay END DESC,
    CASE WHEN p_sort_by = 'payLowToHigh' THEN g.pay END ASC,
    CASE WHEN p_sort_by = 'dateSoonest'  THEN g.date END ASC;
$$;
