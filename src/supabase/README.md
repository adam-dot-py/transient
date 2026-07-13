# Supabase Schema Registry

This directory is the single source of truth for the Supabase database schema used by Transient. It defines the contract between local mock data (development) and the live Supabase project (test/production).

## Purpose

- Provide TypeScript types matching every Supabase table so mock data and real queries share the same shape
- Document the database DDL, RLS policies, and storage configuration in one place
- Enable mock-first development — the app runs entirely on local data during development, with Supabase only required for test/production environments

## Directory Contents

| File | Description |
|------|-------------|
| `types.ts` | TypeScript types for all tables (Row, Insert, Update variants) |
| `schema.sql` | Complete DDL reference — CREATE TABLE, indexes, RLS policies |
| `client.ts` | Supabase client initialisation (null in dev, configured via env vars) |
| `README.md` | This file — schema conventions and documentation |

## Tables

| Table | Description |
|-------|-------------|
| `profiles` | Base user profile (id, display_name, role, avatar_url) |
| `musician_profiles` | Extended musician data (bio, city, country, genres, music_links) |
| `gigs` | Gig listings created by host users |
| `example_songs` | Song references attached to a gig (title + artist) |
| `applications` | Musician applications to gigs (status: pending/accepted/declined) |
| `push_tokens` | Device push notification tokens (Expo push tokens) |
| `notifications` | Notification history for in-app activity feed |

## Storage Bucket

| Bucket | Access | Max Size | MIME Types | Path Pattern |
|--------|--------|----------|------------|--------------|
| `profile-pictures` | Auth required | 5 MB | image/jpeg, image/png | `{user_id}/avatar.{ext}` |

Users can only upload/update/delete files within their own `{user_id}/` prefix. Any authenticated user can read any file (required for viewing other profiles).

## Type Conventions

### `types.ts` is the frontend source of truth

All frontend code references the types exported from `types.ts`. These types directly mirror the Supabase table columns with TypeScript equivalents:

- `uuid` → `string`
- `text` → `string`
- `text[]` → `string[]`
- `jsonb` → typed interface (e.g. `MusicLink[]`)
- `timestamptz` / `date` / `time` → `string` (ISO format)
- `integer` / `double precision` → `number`
- `boolean` → `boolean`
- Nullable columns → `T | null`

### `schema.sql` is the DDL reference

The SQL file documents the exact Postgres DDL — constraints, defaults, indexes, and RLS policies. When a schema change is needed:

1. Update `schema.sql` first (the authoritative DDL)
2. Update `types.ts` to match
3. Update mock data to conform to the new shape
4. Then implement the feature code

### Relationship between types.ts and src/types/index.ts

- `src/types/index.ts` contains **domain model types** used throughout the app (e.g. `Gig`, `Genre`, `FullMusicianProfile`)
- `src/supabase/types.ts` contains **database row types** that map 1:1 to Supabase tables
- Domain types may differ from row types (e.g. camelCase vs snake_case, computed fields, joined data)
- Service modules handle the transformation between database rows and domain types

## RLS Policy Summary

| Table | Read | Write |
|-------|------|-------|
| `profiles` | Any authenticated user | Owner only (own row) |
| `musician_profiles` | Any authenticated user | Owner only (own row) |
| `gigs` | Any authenticated user (available gigs) | Hoster only (own gigs) |
| `example_songs` | Any authenticated user | Gig hoster only |
| `applications` | Musician (own apps) + Hoster (apps for their gigs) | Musician creates; Hoster updates status |
| `push_tokens` | Owner only | Owner only |
| `notifications` | Owner only | System/Edge Functions only |

## Environment Variables

The Supabase client requires two environment variables to connect (not needed for local development):

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public API key |

These can be set via:
- `.env` file with `EXPO_PUBLIC_` prefix (Expo SDK 49+)
- `app.json` → `extra` field (accessed via expo-constants)
- EAS build secrets (for CI/CD builds)

## Development Workflow

1. **Local development** — No Supabase connection required. All data comes from `src/data/mock*.ts` files that conform to the types defined here.
2. **Test environment** — Uses a Supabase test project. Set env vars to connect.
3. **Production** — Uses the production Supabase project. Secrets managed via EAS.

The `client.ts` module returns `null` when no credentials are configured, so service modules gracefully fall back to mock data.
