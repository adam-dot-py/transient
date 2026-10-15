# 05 — TestFlight readiness

What specifically must be true before you cut a production EAS build and submit
to TestFlight. This complements the repo's own `.kiro/steering/deployment.md`
(the authoritative build/release doc) — read that for the EAS mechanics; this
file is the **Supabase-and-data** slice.

## Backend must-haves

- [ ] Schema applied to the Supabase project (file 02), verified with the
      `pg_tables` / `search_gigs` / `pg_extension` checks.
- [ ] RLS confirmed **on** for all 8 tables, and the anon-can't-read check from
      file 03 passes.
- [ ] `handle_new_user` trigger (or a reliable client-side equivalent) creates a
      `profiles` row on sign-up — otherwise authenticated users have no profile
      and every FK write fails.
- [ ] Auth providers configured: at minimum **email**; add **Apple** before
      public release (App Store requires it alongside other social logins).
      OAuth redirect `transient://...` registered with each provider and in
      Supabase URL config.
- [ ] `profile-pictures` storage bucket exists (private, 5 MB, jpeg/png) with its
      policies.

## App must-haves

- [ ] `@supabase/supabase-js` + `react-native-url-polyfill` installed; the
      `createClient` block in `src/supabase/client.ts` uncommented (file 04).
- [ ] `AuthContext` delegates to Supabase Auth (real JWT) — not the mock session.
- [ ] At least the core read/write paths converted (Gig create/list, Application
      submit/approve). Anything still on mocks will show stale/local-only data to
      testers, so decide consciously what ships live vs mock for the beta.
- [ ] `CURRENT_USER.id` replaced with the real session user id on every live path
      (search `CURRENT_USER` across `src/` — it appears in `GigContext`, the gig
      detail Apply flow, and elsewhere).

## EAS env / secrets (per profile)

- [ ] `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set as EAS
      env vars for the `preview` and `production` profiles (they are **not** read
      from `.env.local` in cloud builds).
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` set if the Amplify payment flow ships
      live (see below).
- [ ] **No** service_role key anywhere in the app bundle or `EXPO_PUBLIC_*`.

## Amplify / Stripe (only if payments ship in the beta)

The Amplify purchase deliberately does **not** write the DB from the client.
`src/services/stripeService.ts` expects two **Supabase Edge Functions**:

- `create-amplify-payment-intent` — creates the £1.79 Stripe PaymentIntent,
  returns the client secret.
- `record-amplify-payment` — inserts the `amplify_payments` row server-side
  (using the service_role key, which lives only in the function's env).

Checklist:

- [ ] Both Edge Functions deployed (`supabase functions deploy ...`).
- [ ] Stripe secret key set as a Supabase function secret
      (`supabase secrets set STRIPE_SECRET_KEY=...`) — never in the app.
- [ ] `@stripe/stripe-react-native` installed and the native Apple Pay merchant
      config done (this is a native module → requires a new build, not an OTA).

> If payments aren't part of your first beta, you can ship with Amplify's UI
> present but the purchase gated off, and add the Edge Functions later. That
> keeps the first TestFlight focused on the core gig/apply loop against real data.

## Native-build reminders (from deployment.md)

- Adding `@supabase/supabase-js` is JS-only (no new native module) — an OTA
  update *could* carry it. But if you also add `@stripe/stripe-react-native`,
  that **is** a native module and needs a fresh EAS build, not an OTA.
- `/ios` and `/android` are gitignored build output — don't commit them; EAS
  regenerates from `app.json`.
- Build numbers are managed remotely by EAS (`autoIncrement`); bump
  `expo.version` only for user-facing releases.

## Suggested first-TestFlight scope (my recommendation)

Smallest build that proves the real data path:

1. Real Supabase Auth (email/password), profile auto-creation trigger.
2. Live **gigs**: create + list + detail against the DB.
3. Live **applications**: submit + the host approve/decline flow.
4. Everything else (notifications, Amplify payment, social logins) can stay on
   mocks or be gated for this first pass, then converted in follow-up builds.

That gives testers a genuine end-to-end loop (sign up → create/find a gig →
apply → get approved) backed by Postgres with RLS, which is the thing most worth
validating on real devices before you widen scope.

## Pre-flight (run locally before the production build)

```bash
npx tsc --noEmit        # clean today
npx jest --ci           # 322 passing today
npx expo export --platform web --output-dir /tmp/ci-export   # bundle smoke test
```

Then follow `deployment.md`:
`eas build --profile production --platform ios --auto-submit`.
