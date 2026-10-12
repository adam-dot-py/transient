# Transient — Developer Quickstart

A practical guide to running the app, understanding how it fits together, and
making changes. For deeper context see the steering docs in `.kiro/steering/`
(`product.md`, `tech.md`, `structure.md`, `backend.md`, `deployment.md`).

---

## 1. Run it

```bash
npm install            # once
npx expo start         # Metro dev server
```

Then:
- `i` — iOS simulator   · `a` — Android emulator   · `w` — web
- `r` — reload          · `c` — clear + restart Metro (`npx expo start -c`)

**On your own phone** (needed for native features like GPS/maps):
```bash
npx expo install expo-dev-client      # once
eas device:create                     # register your device (one-time)
eas build --profile development --platform ios
# install the build, then:
npx expo start --dev-client           # scan the QR; JS hot-reloads on device
```

> **Expo Go won't work for native modules.** Maps (`react-native-maps`) and
> location (`expo-location`) need a dev/standalone build. Expo Go is fine only
> for pure-JS screens.

---

## 2. How the app is built (the mental model)

Transient is "Uber for gigs" — a dual **musician / hoster** app on Expo + React
Native + TypeScript, with **Expo Router** file-based navigation.

```
src/
  app/           # SCREENS (file = route). (auth)/ (tabs)/ gig/ profile/
  components/    # Reusable UI (GigCard, FilterChip, SearchBar, …)
  context/       # React Context state (Gig, Auth, Role, Application, …)
  data/          # PURE service functions + mock data (mock*.ts)
  services/      # Side-effectful services (stripe, calendar)
  supabase/      # schema.sql, migrations/, types.ts, client.ts
  types/         # camelCase domain model (Gig, Genre, …)
  constants/     # theme.ts (Brand, Colors, Spacing)
  __tests__/     # Jest + fast-check (data/, components/, properties/, …)
```

### The one rule that explains most of the code: **mock-first**

`src/supabase/client.ts` returns `null` until `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_ANON_KEY` are set. So every data path has **two modes**:

- **Dev (no backend):** services read in-memory mock data (`src/data/mock*.ts`)
  and run pure functions. This is what you see today.
- **Configured:** the same service calls Supabase (`supabase.rpc(...)`,
  `supabase.from(...)`).

The pattern to copy lives in `src/services/stripeService.ts` and
`src/data/searchService.ts`: `if (!supabase) { ...mock... } else { ...rpc... }`.

### Data flow for a screen

```
screen (src/app/.../*.tsx)
  → reads state from a Context (src/context/*)
  → Context wraps PURE service fns (src/data/*Service.ts)
  → services operate on mock data now / Supabase later
```

Keep **business logic in pure service functions** (easy to test), keep **state
in context**, keep **screens thin**.

---

## 3. Make a change

### Fix a screen / UI tweak
Edit the file under `src/app/` or `src/components/`. Save → it hot-reloads.
Styles use `StyleSheet.create()` at the bottom of each file; use theme tokens
from `@/constants/theme` (never hardcode colors). Use `@/` import aliases, never
deep relative paths.

### Add a feature (the standard recipe)
1. **Pure logic** → add/extend a `src/data/<name>Service.ts` with pure functions.
2. **Tests** → `src/__tests__/data/<name>Service.test.ts` (+ a fast-check
   property test for invariants). Match the existing style.
3. **State** → expose it through a context in `src/context/` if screens need it.
4. **UI** → wire it into a screen in `src/app/` using reusable `components/`.
5. **Backend (if it touches data)** → follow `.kiro/steering/backend.md`: add an
   additive migration in `src/supabase/migrations/`, an RPC if needed, keep RLS,
   update `src/supabase/types.ts` + `src/types/index.ts`, and give the service a
   mock-first fallback. Update `BACKEND_SETUP.md`.

> Worked example to read: the Explore **search/filter/sort** feature —
> `src/data/searchService.ts` (pure + mock-first RPC), its tests, the
> `0001_gig_search_postgis.sql` migration, and the UI in
> `src/app/(tabs)/explore.tsx`.

### Add a native module (`expo-*` with native code)
`npx expo install <pkg>` → add any config to `app.json` → **rebuild the native
app** (`npx expo run:ios` or a new EAS build). A JS reload will **not** load it.
Guard the module so a stale binary degrades gracefully (see
`getExpoLocation()` in `src/data/locationService.ts`).

---

## 4. Verify before you share

Always run these three; the app bundles via Babel so TS/lint errors won't block
Metro, but they will bite later:

```bash
npx tsc --noEmit                       # types
npx jest                               # tests (watch a feature: npx jest searchService)
npx expo export --platform web         # proves the whole app still bundles
```

There is a known set of **pre-existing** failures (some theme-literal type
errors and 4 older test suites) unrelated to recent work — compare against those
rather than expecting a fully green baseline.

---

## 5. Ship an update

**JS/asset-only change** (no new native module/permission/icon):
```bash
eas update --branch preview --message "what changed"
```
Testers get it over-the-air, no rebuild.

**Native change** (new `expo-*` module, permission, SDK bump, icon):
```bash
eas build --profile preview --platform ios     # share link, or
eas build --profile production --platform ios --auto-submit   # TestFlight
```

Full build/release details, profiles, and the TestFlight walkthrough are in
`.kiro/steering/deployment.md`.

---

## 6. Common gotchas

- **"Cannot find native module 'X'":** you added a native module but are running
  an old binary — rebuild (`expo run:ios`).
- **Stale/odd behavior after dependency changes:** `npx expo start -c`.
- **Map blank / crashes in Expo Go:** use a dev build; Expo Go can't host
  `react-native-maps`.
- **Secrets:** never commit them. Client values use `EXPO_PUBLIC_` and live in
  `.env*.local` (gitignored) or EAS env vars. Backend secrets live in Supabase.
