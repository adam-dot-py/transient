-- =============================================================================
-- Transient: Complete DDL Schema
-- =============================================================================
-- This file defines the complete database schema for the Transient music
-- gigging marketplace. It serves as the single source of truth for the
-- Supabase PostgreSQL database structure.
--
-- Tables: profiles, musician_profiles, gigs, example_songs, applications,
--         push_tokens, notifications
-- Storage: profile-pictures bucket
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
-- Table: profiles
-- ===========================================================================
CREATE TABLE profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text       NOT NULL,
  role        text        NOT NULL CHECK (role IN ('musician', 'hoster')),
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ===========================================================================
-- Table: musician_profiles
-- ===========================================================================
CREATE TABLE musician_profiles (
  id          uuid        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio         text        CHECK (char_length(bio) <= 500),
  city        text,
  country     text,
  genres      text[]      NOT NULL DEFAULT '{}',
  music_links jsonb       NOT NULL DEFAULT '[]',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER musician_profiles_updated_at
  BEFORE UPDATE ON musician_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: musician_profiles
ALTER TABLE musician_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read musician profiles"
  ON musician_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Owner can update own musician profile"
  ON musician_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Owner can insert own musician profile"
  ON musician_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ===========================================================================
-- Table: gigs
-- ===========================================================================
CREATE TABLE gigs (
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

CREATE TRIGGER gigs_updated_at
  BEFORE UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes: gigs
CREATE INDEX idx_gigs_hoster_id ON gigs(hoster_id);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_date ON gigs(date);

-- RLS: gigs
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read available gigs"
  ON gigs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Hoster can insert own gigs"
  ON gigs FOR INSERT
  WITH CHECK (auth.uid() = hoster_id);

CREATE POLICY "Hoster can update own gigs"
  ON gigs FOR UPDATE
  USING (auth.uid() = hoster_id)
  WITH CHECK (auth.uid() = hoster_id);

CREATE POLICY "Hoster can delete own gigs"
  ON gigs FOR DELETE
  USING (auth.uid() = hoster_id);

-- ===========================================================================
-- Table: example_songs
-- ===========================================================================
CREATE TABLE example_songs (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id     uuid    NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  title      text    NOT NULL CHECK (char_length(title) <= 200),
  artist     text    NOT NULL CHECK (char_length(artist) <= 200),
  sort_order integer NOT NULL DEFAULT 0
);

-- RLS: example_songs
ALTER TABLE example_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read example songs"
  ON example_songs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Gig hoster can insert example songs"
  ON example_songs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  );

CREATE POLICY "Gig hoster can update example songs"
  ON example_songs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  );

CREATE POLICY "Gig hoster can delete example songs"
  ON example_songs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  );

-- ===========================================================================
-- Table: applications
-- ===========================================================================
CREATE TABLE applications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id      uuid        NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  musician_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'pending',
  message     text        CHECK (char_length(message) <= 500),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_application_gig_musician UNIQUE (gig_id, musician_id)
);

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes: applications
CREATE INDEX idx_applications_gig_id ON applications(gig_id);
CREATE INDEX idx_applications_musician_id ON applications(musician_id);

-- RLS: applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Musicians can read own applications"
  ON applications FOR SELECT
  USING (auth.uid() = musician_id);

CREATE POLICY "Hosters can read applications for their gigs"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  );

CREATE POLICY "Musicians can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = musician_id);

CREATE POLICY "Hosters can update application status"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  );

-- ===========================================================================
-- Table: push_tokens
-- ===========================================================================
CREATE TABLE push_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      text        NOT NULL UNIQUE,
  platform   text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes: push_tokens
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

-- RLS: push_tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own push tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================================================
-- Table: notifications
-- ===========================================================================
CREATE TABLE notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  body       text        NOT NULL,
  data       jsonb,
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes: notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);

-- RLS: notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- Table: amplify_payments
-- ===========================================================================
-- Records each Amplify purchase. Linked to the gig that was amplified.
-- The Stripe PaymentIntent ID is stored for reconciliation.
-- ===========================================================================
CREATE TABLE amplify_payments (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id             uuid        NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  user_id            uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_id  text        NOT NULL,
  amount_pence       integer     NOT NULL DEFAULT 179,
  currency           text        NOT NULL DEFAULT 'gbp',
  radius_miles       integer     NOT NULL CHECK (radius_miles IN (5, 10, 15, 25)),
  status             text        NOT NULL DEFAULT 'succeeded',
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Indexes: amplify_payments
CREATE INDEX idx_amplify_payments_gig_id ON amplify_payments(gig_id);
CREATE INDEX idx_amplify_payments_user_id ON amplify_payments(user_id);

-- RLS: amplify_payments
ALTER TABLE amplify_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own amplify payments"
  ON amplify_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own amplify payments"
  ON amplify_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- Storage: profile-pictures bucket
-- ===========================================================================
-- Note: In Supabase, storage buckets are configured via the dashboard or
-- the storage API. The SQL below documents the intended configuration.
-- Actual bucket creation uses the Supabase Storage API.

-- Create the bucket (private, not public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png']
);

-- Storage RLS policies
-- Users can upload/update/delete files in their own {user_id}/ prefix
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'profile-pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Any authenticated user can read profile pictures (for viewing other profiles)
CREATE POLICY "Authenticated users can read profile pictures"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'profile-pictures'
    AND auth.role() = 'authenticated'
  );
