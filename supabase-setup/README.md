# Transient → Supabase setup guide

This folder is a **practical, do-it-in-order guide** for standing up the real
Supabase backend for Transient and connecting it to the Expo app for reads and
writes, ahead of a TestFlight build.

It is written for a **senior data engineer who is new to app development**, so the
database half assumes you (and skips the hand-holding there), while the
app-wiring half explains the React Native / Expo concepts you'll meet along the
way.

> **The schema already exists in the repo.** `src/supabase/schema.sql` is the
> consolidated source of truth and `src/supabase/migrations/` holds additive
> changes on top of it. This guide does **not** invent new tables — it tells you
> exactly how to apply what's already defined, and how to reconcile the two
> files into one run. The TypeScript contract the app expects
> (`src/supabase/types.ts`) is generated from this same schema, so if you change
> a column name here you must change it there too.

## Read in this order

| # | File | What it covers |
|---|------|----------------|
| 1 | [`01-tables.md`](./01-tables.md) | Every table: exact name, columns, types, constraints, indexes. The "what to create" reference you asked for. |
| 2 | [`02-apply-schema.md`](./02-apply-schema.md) | How to actually run the DDL in Supabase (SQL editor vs CLI), in the correct dependency order, including PostGIS and the `search_gigs` RPC. |
| 3 | [`03-rls-and-auth.md`](./03-rls-and-auth.md) | Row Level Security — why every table has it, how `auth.uid()` ties rows to users, and the auth model you must adopt (this is the part most likely to bite you). |
| 4 | [`04-connect-the-app.md`](./04-connect-the-app.md) | Install the client, set env vars, flip the app from mock to live, and the **mock-first read/write pattern** for turning each context into real DB calls. |
| 5 | [`05-testflight-readiness.md`](./05-testflight-readiness.md) | What specifically must be true before a production EAS build, and a copy-paste checklist. |
| 6 | [`06-amplify-push.md`](./06-amplify-push.md) | The Amplify **receive** side: which musicians a broadcast reaches (the `amplify_recipients` RPC + migration `0002`), the in-app gig-card alert, and where real device push plugs in. |

Supporting files:

- [`sql/00_consolidated_setup.sql`](./sql/00_consolidated_setup.sql) — one script
  that runs the base schema **and** the PostGIS migration in the right order.
  Paste this into the Supabase SQL editor for a fresh project.
- [`sql/99_seed_dev_data.sql`](./sql/99_seed_dev_data.sql) — optional seed rows
  so a fresh database isn't empty when you first point the app at it.

## The 30-second mental model

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│  Expo / React Native app │        │          Supabase            │
│                          │         │  (managed Postgres + Auth +  │
│  src/context/*Context    │         │   Storage + Edge Functions)  │
│    └ holds state         │         │                              │
│  src/data/*Service       │  HTTPS  │  Postgres tables (RLS on)    │
│    └ pure logic + I/O ───┼────────▶│  auth.users  ◀── Supabase    │
│  src/supabase/client.ts  │  JWT    │                 Auth issues  │
│    └ the one client ─────┘         │                 the JWT      │
└─────────────────────────┘         └──────────────────────────────┘
```

The single most important idea: **the app never trusts itself for
authorization.** Every table has Row Level Security, and the policies are
written against `auth.uid()` — the user id baked into the JWT that Supabase Auth
issues at login. So "connect the app for reads and writes" is really two jobs:
(a) get a real authenticated session, and (b) make the service layer call
Supabase instead of returning mock arrays. Both are covered in file 04.

## Current state of the repo (so you know what you're changing)

- `src/supabase/client.ts` **returns `null`** today — the `createClient` block is
  deliberately commented out and `@supabase/supabase-js` is **not installed**. The
  whole app runs on in-memory mock data (`src/data/mock*.ts`) until you wire this up.
- Every data service is written **mock-first**: it checks `if (!supabase)` and
  runs an in-memory implementation, otherwise calls Supabase. `searchService.ts`
  and `stripeService.ts` already follow this pattern end-to-end — they're your
  templates.
- Auth is entirely mocked in `src/context/AuthContext.tsx` (it hands out a fake
  session). This is the biggest gap for real-world use, because **no mock session
  satisfies RLS** — Postgres needs a real `auth.users` row behind the JWT.

Nothing in this guide requires editing `schema.sql`; where the app code needs to
change, file 04 gives you the exact diffs.
