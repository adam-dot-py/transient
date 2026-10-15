# 06 — Amplify push: the musician-receive side

Amplify has two halves. The **send** half (a hoster pays £1.79 to broadcast a
gig) was already built. This file documents the **receive** half — *which*
musicians a broadcast reaches and *what they see* — and exactly how it maps onto
Supabase so it works the moment you flip the client on.

> Think Uber: a rider requests a ride, and nearby drivers get a request card
> they can accept or ignore. Here the hoster amplifies a gig, and nearby
> musicians get a **gig-card alert** (`GigPushAlert`) they can **Apply** to or
> dismiss. "Apply" submits a *reviewable* application — the host still approves.

## What was added to the codebase

| Layer | File | Role |
|-------|------|------|
| Pure matcher | `src/data/amplifyService.ts` → `getPushRecipients()` | Given a gig + candidates + radius, returns the musicians to notify, nearest-first. Pure, property-tested. |
| Mock-first orchestrator | `src/data/amplifyService.ts` → `fetchPushRecipients()` | `supabase === null` → in-memory match; else → `amplify_recipients` RPC. Same `PushRecipient[]` contract either way. |
| Migration | `src/supabase/migrations/0002_amplify_recipients.sql` | Adds musician coordinates + `location`, GIST/GIN indexes, the sync trigger, and the `amplify_recipients` RPC. |
| Types | `src/supabase/types.ts` | `musician_profiles` rows gain `latitude`/`longitude`; new `AmplifyRecipientRow`; `amplify_recipients` added to `Database['public']['Functions']`. |
| Create flow | `src/app/(tabs)/create.tsx` | On Amplify, records the payment then calls `fetchPushRecipients` and reports how many were reached. |
| Receive flow | `src/app/_layout.tsx` → `GigPushAlertRenderer` | Apply now calls `submitApplication` (reviewable), **not** `acceptGig` (auto-accept). |
| Geocoding | `src/context/GigContext.tsx` → `createGig` | Now geocodes the address so every created gig has real coordinates — a gig at `(0,0)` can never be matched by radius. |

## The targeting rule (identical in mock and SQL)

A musician receives an amplified gig when **all** hold:

1. they are **not** the gig's hoster;
2. the gig **has a location** (geocoded, not `0,0`);
3. the musician **has a location** (`latitude`/`longitude` set, non-zero, in range);
4. their distance to the gig is **≤ radius** (inclusive);
5. if genre matching is on **and** the gig lists genres, they **share ≥ 1 genre**.

Results are sorted **nearest-first**, tie-broken by id. The mock
(`getPushRecipients`) and the SQL (`amplify_recipients`) are written to produce
the same set in the same order — the Haversine sphere vs the PostGIS spheroid
differ by well under 0.5%, same as `search_gigs`.

**Units:** the app passes **miles**; the RPC converts to **meters** at the
boundary (`miles * 1609.344`) and uses `ST_DWithin` — exactly the
`search_gigs` convention, built on the same shared PostGIS foundation.

## What you must do in Supabase

### 1. Apply migration `0002`

It's additive and idempotent (safe to re-run). From the SQL editor paste
`src/supabase/migrations/0002_amplify_recipients.sql`, or with the CLI:

```bash
supabase db push          # applies migrations in order (0001, then 0002)
```

It adds to `musician_profiles`: `latitude double precision`,
`longitude double precision`, `location geography(Point,4326)`, a GIST index on
`location`, a GIN index on `genres`, and a `BEFORE INSERT/UPDATE` trigger that
keeps `location` in sync (null/zero/out-of-range → `NULL`, i.e. "no location").

### 2. Capture musician coordinates

Radius matching needs a musician **home location**. Today the profile UI
collects `city`/`country` text only. Two options:

- **Geocode on save** (recommended, lowest friction): when a musician saves
  their profile, geocode their city to `latitude`/`longitude` — reuse the exact
  path `createGig` now uses (`geocodeService.geocodeAddress`, swapped for a real
  geocoder in production). Write the two columns on the `musician_profiles`
  upsert; the trigger derives `location`.
- **Device GPS**: ask for location permission and store the device position.
  More precise, more consent friction.

Until a musician has coordinates, they are simply never an Amplify recipient
(the `location IS NOT NULL` guard) — a safe, explicit default.

### 3. The RPC is `SECURITY INVOKER` — RLS still applies

`amplify_recipients` reads only `gigs` and `musician_profiles`, both of which
any authenticated user may already `SELECT`. It returns nothing the caller
couldn't read directly, so **no new policy is needed**. Keep it `SECURITY
INVOKER`; never switch it to `DEFINER` to "simplify" matching.

### 4. Verify

```sql
-- Replace with a real gig id that has a location.
select * from amplify_recipients('00000000-0000-0000-0000-000000000000'::uuid, 10, true);
```

You should get `musician_id`, `distance_miles` rows, nearest first, all within
10 miles, excluding the hoster.

## Delivery: in-app card now, real device push later

This change wires the **targeting + in-app card**. It does **not** yet send an
OS-level push notification to a backgrounded phone. The gap, and where it plugs
in, is already modelled:

- `push_tokens` **already exists** in `schema.sql` (`user_id`, `token`,
  `platform`, with RLS). It is the registry for step 2 below.
- The full "Uber ping" needs three more pieces, none wired yet:
  1. **`expo-notifications`** in the app: register for a push token on login and
     upsert it into `push_tokens`. This is a **native module** → requires a new
     EAS/dev-client build (JS reload won't pick it up), same constraint as
     `expo-location`. Guard it with `requireOptionalNativeModule` so a stale
     binary degrades gracefully.
  2. **A fan-out Edge Function** (`amplify-broadcast`): called after
     `record-amplify-payment`, it runs `amplify_recipients` for the gig, looks up
     each recipient's `push_tokens`, and sends via Expo's push API
     (`https://exp.host/--/api/v2/push/send`). Keep it `SECURITY INVOKER`-equivalent
     by calling with the hoster's JWT, or validate the caller owns the gig.
  3. **A `notifications` row per recipient** (table already exists) so the push
     has an in-app home when the musician opens the app.

Until then, the receive side is demonstrated **in-app**: in the single-device
mock loop, if the signed-in user is themselves a matched recipient, the
`GigPushAlert` card appears. On a real multi-device build, the Edge Function is
what reaches other musicians' phones — the matching logic it calls is already
done and tested.

## Checklist

- [ ] Migration `0002_amplify_recipients.sql` applied (`supabase db push`).
- [ ] Musician profile save writes `latitude`/`longitude` (geocode-on-save or GPS).
- [ ] `amplify_recipients` returns sane rows for a located gig.
- [ ] (For real push) `expo-notifications` added + new native build; tokens
      upserted into `push_tokens`.
- [ ] (For real push) `amplify-broadcast` Edge Function deployed and called after
      payment; writes `notifications` rows and sends Expo pushes.
- [ ] `src/supabase/types.ts` regenerated/aligned after the migration.
