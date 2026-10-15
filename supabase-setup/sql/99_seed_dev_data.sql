-- =============================================================================
-- Transient — OPTIONAL dev/test seed data
-- =============================================================================
-- A fresh database is empty, so the app shows empty states. This script inserts
-- a couple of profiles and gigs so you can see real data flow immediately.
--
-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ READ THIS FIRST — profiles.id must equal a REAL auth.users id.           │
-- │                                                                           │
-- │ Every table FKs to profiles, and profiles.id references auth.users(id).  │
-- │ You CANNOT insert arbitrary UUIDs — Postgres will reject them with a      │
-- │ foreign-key violation. So:                                               │
-- │   1. Create test users first (Supabase dashboard → Authentication →      │
-- │      Users → Add user, or sign up through the app).                      │
-- │   2. Copy their UUIDs (the id column in auth.users).                     │
-- │   3. Replace the two placeholders below, then run this script.           │
-- └─────────────────────────────────────────────────────────────────────────┘
--
-- If you added the handle_new_user trigger (see 03-rls-and-auth.md), the
-- profiles rows already exist for your test users — in that case SKIP the
-- profiles INSERTs here and only run the gigs/example_songs section, using the
-- ids that already exist.
-- =============================================================================

-- Replace these with real auth.users ids:
\set hoster_id  '00000000-0000-0000-0000-000000000001'
\set musician_id '00000000-0000-0000-0000-000000000002'
-- (The \set syntax works in psql. In the Supabase SQL editor, just paste the
--  UUIDs directly in place of the :'hoster_id' / :'musician_id' references.)

-- ---------------------------------------------------------------------------
-- profiles  (skip if the handle_new_user trigger already created these)
-- ---------------------------------------------------------------------------
INSERT INTO profiles (id, display_name, role) VALUES
  (:'hoster_id',   'The Blue Note Lounge', 'hoster'),
  (:'musician_id', 'Rae Holloway',         'musician')
ON CONFLICT (id) DO NOTHING;

INSERT INTO musician_profiles (id, bio, city, country, genres, music_links) VALUES
  (:'musician_id',
   'Soul and jazz vocalist, 6 years gigging around London.',
   'London', 'United Kingdom',
   ARRAY['jazz','blues','pop'],
   '[{"platform":"apple_music","url":"https://music.apple.com/","title":"Live set"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- gigs  (latitude/longitude set to real coords so the location trigger fires
--        and radius search works; London points below)
-- ---------------------------------------------------------------------------
INSERT INTO gigs (
  hoster_id, title, description, venue_name,
  address_line1, city, postcode, country,
  latitude, longitude, date, start_time, end_time,
  genres, pay, status, push_enabled
) VALUES
  (:'hoster_id',
   'Friday Night Jazz Trio', 'Looking for a tight jazz trio for our weekend slot.',
   'The Blue Note Lounge', '12 Soho Square', 'London', 'W1D 3QF', 'United Kingdom',
   51.5155, -0.1322, (CURRENT_DATE + 7), '20:00', '23:00',
   ARRAY['jazz','blues'], 250, 'available', false),
  (:'hoster_id',
   'Acoustic Brunch Set', 'Relaxed acoustic covers for Sunday brunch service.',
   'The Blue Note Lounge', '12 Soho Square', 'London', 'W1D 3QF', 'United Kingdom',
   51.5155, -0.1322, (CURRENT_DATE + 10), '11:00', '14:00',
   ARRAY['folk','pop'], 150, 'available', true);

-- Attach a couple of example songs to the first gig.
INSERT INTO example_songs (gig_id, title, artist, sort_order)
SELECT g.id, s.title, s.artist, s.sort_order
FROM gigs g
CROSS JOIN (VALUES
  ('Fly Me to the Moon', 'Frank Sinatra', 0),
  ('Feeling Good',       'Nina Simone',   1)
) AS s(title, artist, sort_order)
WHERE g.title = 'Friday Night Jazz Trio' AND g.hoster_id = :'hoster_id';

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- select title, city, pay, location is not null as has_location from gigs;
-- Expect has_location = true for both rows (confirms the sync trigger ran).
