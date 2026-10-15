# 01 — Tables to create

This is the complete table reference: **exact name, every column, its type,
nullability, defaults, and constraints**, exactly as defined in
`src/supabase/schema.sql` (base) and `src/supabase/migrations/0001_gig_search_postgis.sql`
(the spatial column + search RPC). The app's TypeScript row types in
`src/supabase/types.ts` mirror these one-for-one.

All tables live in the default **`public`** schema. All timestamps are
`timestamptz` (store UTC, the client formats to local). The app layer uses
camelCase domain objects; these snake_case names are the real column names —
the service layer maps between them.

## Dependency order (create in this sequence)

Several tables have foreign keys, so order matters:

```
auth.users              (managed by Supabase Auth — you do NOT create this)
  └─ profiles           (id = auth.users.id)
       ├─ musician_profiles   (id = profiles.id)
       └─ gigs                (hoster_id → profiles.id)
            ├─ example_songs       (gig_id → gigs.id)
            ├─ applications        (gig_id → gigs.id, musician_id → profiles.id)
            └─ amplify_payments    (gig_id → gigs.id, user_id → profiles.id)
  push_tokens           (user_id → profiles.id)
  notifications         (user_id → profiles.id)
```

The consolidated script in `sql/00_consolidated_setup.sql` already orders them
correctly — you don't have to hand-sequence `CREATE TABLE` statements.

---

## 1. `profiles`

The core identity row. Its primary key **is** the Supabase Auth user id
(`auth.users.id`), which is what makes every RLS policy work. One row per user,
created at sign-up.

| Column | Type | Null? | Default | Notes |
|--------|------|-------|---------|-------|
| `id` | `uuid` | no | — | **PK**, FK → `auth.users(id)` ON DELETE CASCADE |
| `display_name` | `text` | no | — | |
| `role` | `text` | no | — | `CHECK (role IN ('musician','hoster'))` |
| `avatar_url` | `text` | yes | — | path/URL in the `profile-pictures` bucket |
| `created_at` | `timestamptz` | no | `now()` | |
| `updated_at` | `timestamptz` | no | `now()` | auto-maintained by trigger |

Trigger: `profiles_updated_at` (BEFORE UPDATE) sets `updated_at = now()`.

> **App note:** `role` here is the user's *account* role. The in-app toggle
> between "musician" and "hoster" views (`RoleContext`) is a UI preference, not
> this column — a single account can host and perform.

---

## 2. `musician_profiles`

The extended profile a musician builds (bio, location, genres, streaming links).
One row per musician, keyed to `profiles.id`.

| Column | Type | Null? | Default | Notes |
|--------|------|-------|---------|-------|
| `id` | `uuid` | no | — | **PK**, FK → `profiles(id)` ON DELETE CASCADE |
| `bio` | `text` | yes | — | `CHECK (char_length(bio) <= 500)` |
| `city` | `text` | yes | — | |
| `country` | `text` | yes | — | |
| `genres` | `text[]` | no | `'{}'` | array of genre slugs |
| `music_links` | `jsonb` | no | `'[]'` | array of `{platform, url, title}` |
| `updated_at` | `timestamptz` | no | `now()` | trigger-maintained |

`music_links` JSON shape (matches `MusicLink` in `types.ts`):
```json
[{ "platform": "apple_music", "url": "https://...", "title": "My set list" }]
```
`platform` is `'apple_music' | 'google_music'`.

---

## 3. `gigs`

The central entity. A hoster creates a gig; musicians apply.

| Column | Type | Null? | Default | Notes |
|--------|------|-------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `hoster_id` | `uuid` | no | — | FK → `profiles(id)` ON DELETE CASCADE |
| `title` | `text` | no | — | `CHECK (char_length <= 100)` |
| `description` | `text` | yes | — | `CHECK (char_length <= 2000)` |
| `venue_name` | `text` | no | — | `CHECK (char_length <= 100)` |
| `address_line1` | `text` | no | — | `CHECK (char_length <= 100)` |
| `address_line2` | `text` | yes | — | `CHECK (char_length <= 100)` |
| `city` | `text` | no | — | `CHECK (char_length <= 50)` |
| `postcode` | `text` | no | — | `CHECK (char_length <= 15)` |
| `country` | `text` | no | — | `CHECK (char_length <= 60)` |
| `latitude` | `double precision` | no | — | loose coordinate |
| `longitude` | `double precision` | no | — | loose coordinate |
| `location` | `geography(Point,4326)` | yes | — | **added by migration 0001**; kept in sync by trigger |
| `date` | `date` | no | — | gig date (YYYY-MM-DD) |
| `start_time` | `time` | no | — | |
| `end_time` | `time` | no | — | |
| `genres` | `text[]` | no | — | required, ≥1 enforced in app |
| `pay` | `integer` | no | — | `CHECK (pay BETWEEN 1 AND 99999)` |
| `status` | `text` | no | `'available'` | `'available' \| 'accepted' \| 'past'` |
| `push_enabled` | `boolean` | no | `false` | the "Amplify" flag |
| `accepted_musician_ids` | `uuid[]` | no | `'{}'` | denormalised accepted list |
| `created_at` | `timestamptz` | no | `now()` | |
| `updated_at` | `timestamptz` | no | `now()` | trigger-maintained |

Indexes: `idx_gigs_hoster_id`, `idx_gigs_status`, `idx_gigs_date`, plus from the
migration: `idx_gigs_location` (GIST, for radius search) and `idx_gigs_genres`
(GIN, for the `&&` array-overlap filter).

> **The `location` column is special.** You store `latitude`/`longitude` as
> plain numbers, and a `BEFORE INSERT/UPDATE` trigger (`gigs_sync_location_trg`)
> derives the PostGIS `location` point from them — setting it `NULL` for zero or
> out-of-range coordinates. **Never write `location` directly from the app**;
> write lat/lng and let the trigger do it. All proximity features build on this
> one column (see `.kiro/steering/backend.md`).

---

## 4. `example_songs`

Songs a hoster wants in the set, attached to a gig. Many per gig.

| Column | Type | Null? | Default | Notes |
|--------|------|-------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `gig_id` | `uuid` | no | — | FK → `gigs(id)` ON DELETE CASCADE |
| `title` | `text` | no | — | `CHECK (char_length <= 200)` |
| `artist` | `text` | no | — | `CHECK (char_length <= 200)` |
| `sort_order` | `integer` | no | `0` | display order |

App caps this at 10 songs per gig (validated client-side in `gigService.ts`).

---

## 5. `applications`

A musician's application to a gig. **This is what the Apply button now creates**
(it used to auto-accept — fixed in commit `deb0dd7`).

| Column | Type | Null? | Default | Notes |
|--------|------|-------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `gig_id` | `uuid` | no | — | FK → `gigs(id)` ON DELETE CASCADE |
| `musician_id` | `uuid` | no | — | FK → `profiles(id)` ON DELETE CASCADE |
| `status` | `text` | no | `'pending'` | `'pending' \| 'accepted' \| 'declined'` |
| `message` | `text` | yes | — | `CHECK (char_length <= 500)` |
| `created_at` | `timestamptz` | no | `now()` | |
| `updated_at` | `timestamptz` | no | `now()` | trigger-maintained |

**Unique constraint:** `uq_application_gig_musician UNIQUE (gig_id, musician_id)`
— one application per musician per gig. The app checks this before inserting;
the DB enforces it as a backstop (you'll get a `23505` unique-violation if the
app's check races).

Indexes: `idx_applications_gig_id`, `idx_applications_musician_id`.

---

## 6. `push_tokens`

Expo push notification tokens, one or more per user/device.

| Column | Type | Null? | Default | Notes |
|--------|------|-------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | no | — | FK → `profiles(id)` ON DELETE CASCADE |
| `token` | `text` | no | — | **UNIQUE** (ExpoPushToken) |
| `platform` | `text` | no | — | `'ios' \| 'android' \| 'web'` (app-enforced) |
| `created_at` | `timestamptz` | no | `now()` | |

Index: `idx_push_tokens_user_id`.

---

## 7. `notifications`

In-app notification history (approval/decline/new-gig).

| Column | Type | Null? | Default | Notes |
|--------|------|-------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | no | — | FK → `profiles(id)` ON DELETE CASCADE |
| `type` | `text` | no | — | `'new_gig' \| 'application_approved' \| 'application_declined'` |
| `title` | `text` | no | — | |
| `body` | `text` | no | — | |
| `data` | `jsonb` | yes | — | string→string payload (e.g. `{gigId}`) |
| `read` | `boolean` | no | `false` | |
| `created_at` | `timestamptz` | no | `now()` | |

Indexes: `idx_notifications_user_id`, `idx_notifications_user_id_read`
(composite — powers the unread badge count efficiently).

---

## 8. `amplify_payments`

One row per Amplify (£1.79) purchase, for reconciliation against Stripe.

| Column | Type | Null? | Default | Notes |
|--------|------|-------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `gig_id` | `uuid` | no | — | FK → `gigs(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | no | — | FK → `profiles(id)` ON DELETE CASCADE |
| `stripe_payment_id` | `text` | no | — | PaymentIntent id |
| `amount_pence` | `integer` | no | `179` | |
| `currency` | `text` | no | `'gbp'` | |
| `radius_miles` | `integer` | no | — | `CHECK (radius_miles IN (5,10,15,25))` |
| `status` | `text` | no | `'succeeded'` | |
| `created_at` | `timestamptz` | no | `now()` | |

Indexes: `idx_amplify_payments_gig_id`, `idx_amplify_payments_user_id`.

> **Payments are written server-side, not from the app.** The client confirms
> the Stripe sheet, then an **Edge Function** (`record-amplify-payment`) inserts
> this row. See `src/services/stripeService.ts` for the contract. Covered in
> file 05.

---

## Storage bucket: `profile-pictures`

Not a table, but part of the schema. A **private** bucket (not public):

| Setting | Value |
|---------|-------|
| id / name | `profile-pictures` |
| public | `false` |
| file size limit | `5242880` (5 MB) |
| allowed MIME types | `image/jpeg`, `image/png` |

Files are stored under a `{user_id}/` prefix so the storage RLS policies can
check ownership via `(storage.foldername(name))[1] = auth.uid()::text`.

---

## The `search_gigs` RPC (not a table, but you must create it)

Migration 0001 defines a Postgres function `search_gigs(...)` the app calls via
`supabase.rpc('search_gigs', {...})`. It filters gigs by text / genres / pay /
radius and sorts by distance / pay / date, returning every `gigs` column **plus
`distance_miles`** (meters ÷ 1609.344). It is `SECURITY INVOKER`, so the caller's
RLS still applies.

Signature (argument names matter — the client passes them by name):

```
search_gigs(
  p_user_lat           double precision,
  p_user_lng           double precision,
  p_query              text    DEFAULT NULL,
  p_genres             text[]  DEFAULT NULL,
  p_min_pay            integer DEFAULT NULL,
  p_max_pay            integer DEFAULT NULL,
  p_max_distance_miles double precision DEFAULT NULL,
  p_sort_by            text    DEFAULT 'distance'
) RETURNS TABLE (... all gig columns ..., distance_miles double precision)
```

Next: [`02-apply-schema.md`](./02-apply-schema.md) — how to run all of this.
