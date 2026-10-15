-- =============================================================================
-- Transient — consolidated Supabase setup
-- =============================================================================
-- Runs the base schema (src/supabase/schema.sql) AND the PostGIS search
-- migration (src/supabase/migrations/0001_gig_search_postgis.sql) in the
-- correct dependency order, as ONE script for a fresh Supabase project.
--
-- Safe to paste into the Supabase SQL editor. Policies and the storage bucket
-- are guarded so a re-run does not error on "already exists". Tables use plain
-- CREATE TABLE (they assume a fresh DB); if you need to re-run on a populated
-- DB, drop the tables first or run only the sections you need.
--
-- SOURCE OF TRUTH: this file is a convenience copy. If schema.sql or the
-- migration changes, regenerate the relevant section here (and the TS types in
-- src/supabase/types.ts). Do not let them drift.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- profiles
-- ===========================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text        NOT NULL,
  role         text        NOT NULL CHECK (role IN ('musician', 'hoster')),
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ===========================================================================
-- musician_profiles
-- ===========================================================================
CREATE TABLE IF NOT EXISTS musician_profiles (
  id          uuid        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio         text        CHECK (char_length(bio) <= 500),
  city        text,
  country     text,
  genres      text[]      NOT NULL DEFAULT '{}',
  music_links jsonb       NOT NULL DEFAULT '[]',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS musician_profiles_updated_at ON musician_profiles;
CREATE TRIGGER musician_profiles_updated_at
  BEFORE UPDATE ON musician_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE musician_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read musician profiles" ON musician_profiles;
CREATE POLICY "Authenticated users can read musician profiles"
  ON musician_profiles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Owner can update own musician profile" ON musician_profiles;
CREATE POLICY "Owner can update own musician profile"
  ON musician_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Owner can insert own musician profile" ON musician_profiles;
CREATE POLICY "Owner can insert own musician profile"
  ON musician_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ===========================================================================
-- gigs  (includes the migration's `location` column up front)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS gigs (
  id                    uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  hoster_id             uuid             NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                 text             NOT NULL CHECK (char_length(title) <= 100),
  description           text             CHECK (char_length(description) <= 2000),
  venue_name            text             NOT NULL CHECK (char_length(venue_name) <= 100),
  address_line1         text             NOT NULL CHECK (char_length(address_line1) <= 100),
  address_line2         text             CHECK (char_length(address_line2) <= 100),
  city                  text             NOT NULL CHECK (char_length(city) <= 50),
  postcode              text             NOT NULL CHECK (char_length(postcode) <= 15),
  country               text             NOT NULL CHECK (char_length(country) <= 60),
  latitude              double precision NOT NULL,
  longitude             double precision NOT NULL,
  location              geography(Point, 4326),
  date                  date             NOT NULL,
  start_time            time             NOT NULL,
  end_time              time             NOT NULL,
  genres                text[]           NOT NULL,
  pay                   integer          NOT NULL CHECK (pay BETWEEN 1 AND 99999),
  status                text             NOT NULL DEFAULT 'available',
  push_enabled          boolean          NOT NULL DEFAULT false,
  accepted_musician_ids uuid[]           NOT NULL DEFAULT '{}',
  created_at            timestamptz      NOT NULL DEFAULT now(),
  updated_at            timestamptz      NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS gigs_updated_at ON gigs;
CREATE TRIGGER gigs_updated_at
  BEFORE UPDATE ON gigs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Keep `location` in sync with latitude/longitude (mirrors isValidCoordinate:
-- zero / null / out-of-range => NULL location). Longitude is X, latitude is Y.
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
  FOR EACH ROW EXECUTE FUNCTION gigs_sync_location();

CREATE INDEX IF NOT EXISTS idx_gigs_hoster_id ON gigs(hoster_id);
CREATE INDEX IF NOT EXISTS idx_gigs_status    ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_date      ON gigs(date);
CREATE INDEX IF NOT EXISTS idx_gigs_location  ON gigs USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_gigs_genres    ON gigs USING GIN (genres);

ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read available gigs" ON gigs;
CREATE POLICY "Authenticated users can read available gigs"
  ON gigs FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Hoster can insert own gigs" ON gigs;
CREATE POLICY "Hoster can insert own gigs"
  ON gigs FOR INSERT WITH CHECK (auth.uid() = hoster_id);
DROP POLICY IF EXISTS "Hoster can update own gigs" ON gigs;
CREATE POLICY "Hoster can update own gigs"
  ON gigs FOR UPDATE USING (auth.uid() = hoster_id) WITH CHECK (auth.uid() = hoster_id);
DROP POLICY IF EXISTS "Hoster can delete own gigs" ON gigs;
CREATE POLICY "Hoster can delete own gigs"
  ON gigs FOR DELETE USING (auth.uid() = hoster_id);

-- ===========================================================================
-- example_songs
-- ===========================================================================
CREATE TABLE IF NOT EXISTS example_songs (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id     uuid    NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  title      text    NOT NULL CHECK (char_length(title) <= 200),
  artist     text    NOT NULL CHECK (char_length(artist) <= 200),
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE example_songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read example songs" ON example_songs;
CREATE POLICY "Authenticated users can read example songs"
  ON example_songs FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Gig hoster can insert example songs" ON example_songs;
CREATE POLICY "Gig hoster can insert example songs"
  ON example_songs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()));
DROP POLICY IF EXISTS "Gig hoster can update example songs" ON example_songs;
CREATE POLICY "Gig hoster can update example songs"
  ON example_songs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()));
DROP POLICY IF EXISTS "Gig hoster can delete example songs" ON example_songs;
CREATE POLICY "Gig hoster can delete example songs"
  ON example_songs FOR DELETE
  USING (EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()));

-- ===========================================================================
-- applications
-- ===========================================================================
CREATE TABLE IF NOT EXISTS applications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id      uuid        NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  musician_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'pending',
  message     text        CHECK (char_length(message) <= 500),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_application_gig_musician UNIQUE (gig_id, musician_id)
);

DROP TRIGGER IF EXISTS applications_updated_at ON applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_applications_gig_id      ON applications(gig_id);
CREATE INDEX IF NOT EXISTS idx_applications_musician_id ON applications(musician_id);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Musicians can read own applications" ON applications;
CREATE POLICY "Musicians can read own applications"
  ON applications FOR SELECT USING (auth.uid() = musician_id);
DROP POLICY IF EXISTS "Hosters can read applications for their gigs" ON applications;
CREATE POLICY "Hosters can read applications for their gigs"
  ON applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()));
DROP POLICY IF EXISTS "Musicians can create applications" ON applications;
CREATE POLICY "Musicians can create applications"
  ON applications FOR INSERT WITH CHECK (auth.uid() = musician_id);
DROP POLICY IF EXISTS "Hosters can update application status" ON applications;
CREATE POLICY "Hosters can update application status"
  ON applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()));

-- ===========================================================================
-- push_tokens
-- ===========================================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      text        NOT NULL UNIQUE,
  platform   text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own push tokens" ON push_tokens;
CREATE POLICY "Users can read own push tokens"
  ON push_tokens FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own push tokens" ON push_tokens;
CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own push tokens" ON push_tokens;
CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own push tokens" ON push_tokens;
CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE USING (auth.uid() = user_id);

-- ===========================================================================
-- notifications
-- ===========================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  body       text        NOT NULL,
  data       jsonb,
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id      ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- amplify_payments
-- ===========================================================================
CREATE TABLE IF NOT EXISTS amplify_payments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id            uuid        NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_id text        NOT NULL,
  amount_pence      integer     NOT NULL DEFAULT 179,
  currency          text        NOT NULL DEFAULT 'gbp',
  radius_miles      integer     NOT NULL CHECK (radius_miles IN (5, 10, 15, 25)),
  status            text        NOT NULL DEFAULT 'succeeded',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amplify_payments_gig_id  ON amplify_payments(gig_id);
CREATE INDEX IF NOT EXISTS idx_amplify_payments_user_id ON amplify_payments(user_id);

ALTER TABLE amplify_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own amplify payments" ON amplify_payments;
CREATE POLICY "Users can read own amplify payments"
  ON amplify_payments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own amplify payments" ON amplify_payments;
CREATE POLICY "Users can insert own amplify payments"
  ON amplify_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- search_gigs RPC (SECURITY INVOKER — caller's RLS still applies)
-- ===========================================================================
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
LANGUAGE sql STABLE SECURITY INVOKER
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
    CASE WHEN g.location IS NULL THEN NULL
         ELSE ST_Distance(g.location, o.pt) / 1609.344
    END AS distance_miles
  FROM gigs g CROSS JOIN origin o
  WHERE g.status = 'available'
    AND (p_query IS NULL OR
         (g.title ILIKE '%' || p_query || '%'
          OR g.venue_name ILIKE '%' || p_query || '%'
          OR g.city ILIKE '%' || p_query || '%'))
    AND (p_genres IS NULL OR g.genres && p_genres)
    AND (p_min_pay IS NULL OR g.pay >= p_min_pay)
    AND (p_max_pay IS NULL OR g.pay <= p_max_pay)
    AND (p_max_distance_miles IS NULL OR
         (g.location IS NOT NULL
          AND ST_DWithin(g.location, o.pt, p_max_distance_miles * 1609.344)))
  ORDER BY
    CASE WHEN p_sort_by = 'distance'     THEN ST_Distance(g.location, o.pt) END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'payHighToLow' THEN g.pay END DESC,
    CASE WHEN p_sort_by = 'payLowToHigh' THEN g.pay END ASC,
    CASE WHEN p_sort_by = 'dateSoonest'  THEN g.date END ASC;
$$;

-- ===========================================================================
-- Storage: profile-pictures bucket (private, 5 MB, jpeg/png)
-- ===========================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-pictures', 'profile-pictures', false, 5242880,
        ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Authenticated users can read profile pictures" ON storage.objects;
CREATE POLICY "Authenticated users can read profile pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

-- =============================================================================
-- Done. Verify with:
--   select tablename from pg_tables where schemaname = 'public' order by 1;
--   select proname from pg_proc where proname = 'search_gigs';
--   select extname from pg_extension where extname in ('postgis','pgcrypto');
-- =============================================================================
