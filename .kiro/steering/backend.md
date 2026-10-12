# Backend Architecture

Transient's backend is **Supabase (PostgreSQL)**. The project owner is a senior data
engineer: new features must be designed to live in the database, not just the client.
Push filtering, sorting, and aggregation down into Postgres (RPC functions, indexed
columns, RLS) rather than pulling rows to the device and processing them in JS.

The front end develops against local mock data (`src/data/mock*.ts`); the Supabase
client (`src/supabase/client.ts`) returns `null` until `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_ANON_KEY` are set. Every data service must therefore be
**mock-first**: run an in-memory implementation when `supabase` is `null`, and call
Supabase when a client exists. See `src/services/stripeService.ts` for the pattern.

## Source-of-truth files

- `src/supabase/schema.sql` — complete DDL (tables, indexes, RLS, triggers).
- `src/supabase/migrations/` — ordered, additive, idempotent migrations layered on top
  of the base schema. New structural changes go here, not by editing `schema.sql` in
  place (keep `schema.sql` as the consolidated current state and add a migration for the
  change).
- `src/supabase/types.ts` — snake_case DB row types (`Row`/`Insert`/`Update`) and the
  `Database` interface used to type the client.
- `src/types/index.ts` — camelCase domain model used throughout the app.
- `BACKEND_SETUP.md` — gitignored private setup guide (Supabase, Stripe, storage, Edge
  Functions, env vars, auth providers). Update it whenever a feature adds a migration,
  RPC, bucket, Edge Function, or secret.

## Geospatial foundation (PostGIS)

All location/proximity features — gig search by radius, the Amplify radius push,
"gigs near me" on the dashboard, map clustering — MUST build on one shared spatial
foundation rather than reinventing distance math per feature.

### Current state (verified)

- `gigs` stores `latitude` / `longitude` as `double precision` (loose coordinates).
- Only the `pgcrypto` extension is enabled. **PostGIS is not enabled.**
- Indexes on `gigs` are `idx_gigs_hoster_id`, `idx_gigs_status`, `idx_gigs_date` only —
  there is **no spatial index** and **no `geography`/`geometry` column**. A naive radius
  query is a full-table scan computing distance per row.

### The standard every geo feature follows

1. **Enable PostGIS once:** `CREATE EXTENSION IF NOT EXISTS postgis;` (in a migration).
2. **Store a real spatial column:** add `location geography(Point, 4326)` to any table
   that needs proximity (starting with `gigs`), kept in sync with its `latitude` /
   `longitude`. SRID 4326 (WGS84) is the project standard.
3. **Index it:** `CREATE INDEX ... USING GIST (location);` for every spatial column.
   Add `USING GIN (genres)` where array-overlap filtering on `genres text[]` is needed.
4. **Query spatially in SQL:** use `ST_DWithin(location, point, meters)` for radius
   predicates and `ST_Distance(location, point)` for distance values/sorting. Convert
   the app's **miles** to **meters** at the SQL boundary (`miles * 1609.344`).
5. **Expose through an RPC:** wrap non-trivial geo queries in a Postgres function
   callable via `supabase.rpc('<name>', ...)`. Declare functions `SECURITY INVOKER` so
   the caller's RLS still applies — never bypass row-level security for convenience.
6. **Mirror in the mock layer:** the TS service provides a pure in-memory Haversine
   equivalent (`getDistanceMiles`) so the dev loop behaves the same with `supabase`
   `null`. Keep the mock and SQL semantics aligned (same units, same inclusive/exclusive
   bounds, same sort order).

### Conventions

- **Units:** the app layer speaks **miles**; the database speaks **meters**. Convert only
  at the SQL/RPC boundary. Amplify radius options are `[5, 10, 15, 25]` miles
  (`AMPLIFY_CONFIG.radiusOptions`) — reuse this set for any radius selector.
- **Distance values** returned to the client are `distance_miles` (number, miles).
- **Zero/invalid coordinates** (`lat === 0 || lng === 0`, or out of range) are treated as
  "no location" and excluded from radius results — see `isValidCoordinate` in
  `src/data/gigService.ts`.
- Keep client-side service functions **pure** (no mutation) so they remain testable with
  Jest + fast-check, matching the existing `src/data/*Service.ts` style.

## RLS is mandatory

Every table has Row Level Security enabled. When adding a table, column, RPC, or Edge
Function, define/verify its RLS policies in the same migration. RPCs must not read or
return data the caller could not read directly. The `gigs` SELECT policy currently allows
any authenticated user to read; preserve that unless a feature explicitly narrows it.

## Type mapping

| Postgres | TypeScript |
|----------|-----------|
| `uuid` | `string` |
| `text` / `text[]` | `string` / `string[]` |
| `jsonb` | typed interface |
| `timestamptz` / `date` / `time` | `string` (ISO) |
| `integer` / `double precision` | `number` |
| `geography(Point,4326)` | not sent raw to the client; expose derived `distance_miles` / lat+lng |
| nullable | `T \| null` |

Service modules translate snake_case rows (`types.ts`) to camelCase domain objects
(`src/types/index.ts`). Do not leak snake_case shapes into components.

## Checklist for any new backend-touching feature

- [ ] Design states which tables/columns/indexes/RPCs/policies it adds or changes.
- [ ] Structural changes land as an additive, idempotent migration in `src/supabase/migrations/`.
- [ ] Proximity logic uses the PostGIS foundation above (no ad-hoc distance columns or per-feature math).
- [ ] RLS policies defined/verified in the same migration; RPCs are `SECURITY INVOKER`.
- [ ] `src/supabase/types.ts` and `src/types/index.ts` updated and kept in sync.
- [ ] A mock-first TS service mirrors the DB behaviour for the `supabase === null` dev loop.
- [ ] `BACKEND_SETUP.md` updated with any new migration, RPC, bucket, function, or secret.
- [ ] Pure service functions covered by Jest + fast-check tests.
