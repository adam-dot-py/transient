-- =============================================================================
-- 0004_gig_image.sql
-- Optional gig image — lets a hoster attach a hero/card image to a gig.
--
-- Additive and idempotent: safe to run on top of schema.sql + 0001 + 0002 +
-- 0003 repeatedly. This migration is the source of the structural change;
-- schema.sql remains the consolidated current state.
--
-- Context: a gig previously had no image, so the app rendered a gradient
-- placeholder on the gig-detail hero card and the gig cards. This column lets
-- the hoster optionally store an image reference; when it is NULL the UI keeps
-- the gradient placeholder as the default.
--
-- Adds:
--   * gigs.image_url text — nullable. Stores an image reference. In mock-first
--     development this is a local uri returned by the in-app picker (see
--     src/components/GigImagePicker.tsx, mirroring AvatarUploader). For a LIVE
--     backend the image would be uploaded to a Supabase Storage bucket and this
--     column would hold the object path / public URL. No bucket is created here
--     because the mock dev loop does not need one; provisioning a 'gig-images'
--     bucket is documented in the feature's supabase-report.md for live use.
--
-- RLS: no new policy is required. image_url lives on the existing gigs row, so
-- the existing gigs policies (public SELECT of gigs; hoster-only INSERT/UPDATE
-- of their own gigs) already govern who can read and write this column.
-- =============================================================================

ALTER TABLE gigs ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN gigs.image_url IS
  'Optional gig image reference (storage object path / URL for live; local uri in mock mode). NULL = render the gradient placeholder.';
