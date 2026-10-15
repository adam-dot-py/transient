# 02 — Applying the schema to Supabase

Two ways to get the schema into your Supabase project. As a data engineer you'll
likely prefer the CLI (version-controlled, repeatable), but the dashboard route
is the fastest for a first pass.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com) →
   New project). Pick a region close to your users; note the **project ref**
   (the `abcdefgh` in `https://abcdefgh.supabase.co`).
2. From **Project Settings → API**, copy:
   - **Project URL** → becomes `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → becomes `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → server-side only (Edge Functions / migrations); **never** ships in the app.

> **Free tier is fine for TestFlight.** The database pauses after inactivity on
> free projects — fine for beta testing, but move to a paid plan before you rely
> on it for real users.

---

## Option A — SQL editor (fastest)

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste the entire contents of
   [`sql/00_consolidated_setup.sql`](./sql/00_consolidated_setup.sql) and **Run**.
3. That one script creates both extensions, all 8 tables (in dependency order),
   all triggers, all indexes, every RLS policy, the `search_gigs` RPC, and the
   `profile-pictures` storage bucket + its policies.

Verify (run these in the SQL editor):

```sql
-- 8 tables expected
select tablename from pg_tables where schemaname = 'public' order by 1;
-- search_gigs present
select proname from pg_proc where proname = 'search_gigs';
-- extensions present
select extname from pg_extension where extname in ('postgis','pgcrypto');
-- RLS on everywhere (rowsecurity should be true for all)
select relname, relrowsecurity from pg_class
 where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;
```

> **PostGIS note:** on Supabase, PostGIS installs into a dedicated `extensions`
> schema. `CREATE EXTENSION IF NOT EXISTS postgis;` works from the SQL editor;
> if you hit a "permission denied to create extension" error, enable PostGIS
> first via **Database → Extensions → postgis** (toggle on), then re-run the
> script — the `IF NOT EXISTS` makes that safe.

---

## Option B — Supabase CLI (recommended for ongoing work)

This mirrors how you'd manage a Postgres project with migrations — the model
you already know.

```bash
# 1. Install (macOS)
brew install supabase/tap/supabase

# 2. From the repo root, initialise once (creates ./supabase/)
supabase init

# 3. Link to your remote project (uses the project ref)
supabase link --project-ref <your-project-ref>

# 4. Bring the repo's SQL in as migrations. The repo already structures this:
#    - src/supabase/schema.sql                     (base)
#    - src/supabase/migrations/0001_gig_search_postgis.sql
#    Copy them into supabase/migrations/ with timestamped names, e.g.:
cp src/supabase/schema.sql \
   supabase/migrations/20250101000000_base_schema.sql
cp src/supabase/migrations/0001_gig_search_postgis.sql \
   supabase/migrations/20250101000100_gig_search_postgis.sql

# 5. Push to the remote database
supabase db push
```

> **Keep one source of truth.** The repo's convention (see
> `.kiro/steering/backend.md`) is: `schema.sql` is the *consolidated current
> state*, and new structural changes land as additive, idempotent files in
> `src/supabase/migrations/`. When you add a migration there, also fold it into
> `schema.sql` so the consolidated file stays current. Don't maintain a third
> divergent copy inside `supabase/migrations/` long-term — generate it from
> these.

### Regenerating the TypeScript types

The app's `src/supabase/types.ts` is the compile-time contract. After any schema
change, regenerate it from the live DB so the two never drift:

```bash
supabase gen types typescript --project-id <your-project-ref> \
  > src/supabase/types.ts
```

Review the diff — the hand-written file has a couple of niceties (the
`SearchGigRow`/`search_gigs` typing, the `TableRow`/`TableInsert` helpers) you
may want to preserve or re-add.

---

## Dependency order (why the script is sequenced the way it is)

`CREATE TABLE` fails if a referenced table doesn't exist yet. The script creates
`profiles` first (it references `auth.users`, which Supabase manages), then
everything that points at `profiles`, then children of `gigs`. The
`search_gigs` function is created last because it reads `gigs.location`, added
earlier in the same script. The consolidated file handles all of this — you only
need to care about order if you run sections piecemeal.

---

## Seeding dev data (optional)

A fresh DB is empty, so the app will show empty states. To exercise it with
realistic rows, see [`sql/99_seed_dev_data.sql`](./sql/99_seed_dev_data.sql).
**Read its header first** — because every row keys off a real `auth.users` id,
you must create test users (file 03) and substitute their UUIDs before running
the seed.

Next: [`03-rls-and-auth.md`](./03-rls-and-auth.md) — the authorization model you
must adopt, and why mock auth won't work against a real database.
