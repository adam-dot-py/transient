# 04 — Connecting the app for reads and writes

This is the hands-on half: install the client, give it credentials, flip it from
mock to live, and convert each data path. The app is built **mock-first**, which
makes this incremental — you turn on real data one service at a time, and
anything you haven't converted keeps working on mocks.

## Concepts you'll meet (quick primer)

- **`src/supabase/client.ts`** exports a single `supabase` object. Today it's
  `null`. Once it holds a real client, services detect that and switch to live
  calls. It's the one and only place the client is created.
- **Service layer** (`src/data/*Service.ts`): pure functions + the I/O calls.
  Already written to branch on `if (!supabase)`. This is where reads/writes live.
- **Context layer** (`src/context/*Context.tsx`): React providers that hold
  state in `useState` and expose actions to screens. Today they initialise from
  `MOCK_*` arrays **synchronously**. To go live, they load **asynchronously**
  from the services. This is the main code change.
- **PostgREST**: Supabase auto-generates a REST API over your tables.
  `supabase.from('gigs').select()` is a GET; `.insert()/.update()/.delete()` are
  the writes. RLS is applied automatically because the JWT rides along.
- **RPC**: `supabase.rpc('search_gigs', {...})` calls the Postgres function.

## Step 1 — install the client

```bash
npm install @supabase/supabase-js
# React Native needs a URL polyfill for supabase-js:
npx expo install react-native-url-polyfill
```

`@react-native-async-storage/async-storage` is **already** a dependency —
supabase-js uses it to persist the session between launches.

## Step 2 — set environment variables

Client-visible vars use the `EXPO_PUBLIC_` prefix. Create `.env.local` in the
repo root (it's gitignored via `.env*.local`):

```bash
# .env.local  — DO NOT COMMIT
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
```

> The **anon key is safe to ship** — it's public by design, and RLS is what
> protects your data. The **service_role key is not** and must never appear in
> the app or in `EXPO_PUBLIC_*`.

For **EAS cloud builds** (TestFlight), these aren't read from `.env.local`. Set
them as EAS environment variables per profile:

```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://...supabase.co" --environment preview --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon-key>" --environment preview --environment production
```

## Step 3 — turn on the client

`src/supabase/client.ts` already reads the env vars and only builds a client when
they're present (so your dev loop stays on mocks until you opt in). You just need
to **uncomment the real creation block** and add the polyfill import. Target diff:

```diff
--- a/src/supabase/client.ts
+++ b/src/supabase/client.ts
@@
+import 'react-native-url-polyfill/auto';
 import type { Database } from '@/supabase/types';
@@ function createClient() {
   const config = getSupabaseConfig();
   if (!config) {
     return null;
   }
-  // Fallback: package not installed yet
-  return null;
+  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
+  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
+  return createSupabaseClient<Database>(config.url, config.anonKey, {
+    auth: {
+      storage: AsyncStorage,
+      autoRefreshToken: true,
+      persistSession: true,
+      detectSessionInUrl: false, // native apps don't use URL-based session detection
+    },
+  });
 }
```

Now, with env vars set, `supabase` is a real client; with them unset (plain
`npx expo start` and no `.env.local`), it stays `null` and the app runs on mocks
exactly as before. **That toggle is the whole point of the mock-first design** —
keep it intact.

## Step 4 — make auth real (do this before any table work)

Per file 03, RLS needs a real session. Convert `src/context/AuthContext.tsx` to
delegate to Supabase Auth. The public shape of the context (`session`,
`signIn`, `signInWithProvider`, `signUp`, `signOut`) stays the same, so **no
screen changes** — only the provider internals. Sketch:

```tsx
// src/context/AuthContext.tsx  (live path)
import { supabase } from '@/supabase/client';

// On mount: hydrate the session and subscribe to changes.
useEffect(() => {
  if (!supabase) return;                       // mock mode: keep existing behaviour
  supabase.auth.getSession().then(({ data }) =>
    setState((s) => ({ ...s, session: data.session, isLoading: false })));
  const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
    setState((s) => ({ ...s, session })));
  return () => sub.subscription.unsubscribe();
}, []);

const signIn = useCallback(async (email, password) => {
  if (!supabase) { /* ...keep the existing mock branch... */ return; }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) setState((s) => ({ ...s, error: error.message }));
}, []);

const signInWithProvider = useCallback(async (provider) => {
  if (!supabase) { /* mock */ return; }
  await supabase.auth.signInWithOAuth({
    provider,                                   // 'apple' | 'google' | 'facebook'
    options: { redirectTo: 'transient://auth-callback' },
  });
}, []);
```

Keep the mock branch behind `if (!supabase)` so the offline dev loop still works
without a backend. The `Session` type the app uses is a subset of supabase-js's
session — map `session.user.id` through unchanged; it's the UUID RLS keys off.

> **`CURRENT_USER` goes away in live mode.** Lots of code uses
> `CURRENT_USER.id` from `src/data/mockProfiles.ts` as "the logged-in user"
> (e.g. `GigContext.createGig`, the Apply button). In live mode that must become
> `session.user.id`. The cleanest path: expose a `useCurrentUserId()` hook that
> returns `supabase ? session.user.id : CURRENT_USER.id`, and swap call sites to
> it. Do this as you convert each context.

## Step 5 — the mock-first read/write pattern (your template)

**`src/data/searchService.ts` and `src/services/stripeService.ts` already do
this end-to-end — copy their shape.** The rule is: every I/O function checks the
client, runs the in-memory version when it's `null`, and calls Supabase
otherwise, returning the **same type** either way.

### A read

```ts
// src/data/gigService.ts  — add alongside the pure helpers
import { supabase } from '@/supabase/client';
import type { Gig } from '@/types';
import { MOCK_GIGS } from '@/data/mockGigs';
import { fromGigRow } from '@/supabase/mappers'; // snake_case Row -> camelCase Gig

export async function fetchGigs(): Promise<Gig[]> {
  if (!supabase) return MOCK_GIGS;               // dev loop, unchanged
  const { data, error } = await supabase
    .from('gigs')
    .select('*')
    .eq('status', 'available')
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromGigRow);           // map rows to domain objects
}
```

### A write

```ts
export async function insertGig(input: CreateGigInput, hosterId: string): Promise<Gig> {
  if (!supabase) {
    // reuse the existing pure createGig against the in-memory array
    const res = createGig(MOCK_GIGS, input, hosterId);
    if ('error' in res) throw res.error;
    return res.gig;
  }
  const { data, error } = await supabase
    .from('gigs')
    .insert(toGigInsert(input, hosterId))        // camelCase -> snake_case Insert
    .select()
    .single();
  if (error) throw error;                        // RLS violation surfaces here too
  return fromGigRow(data);
}
```

Notice you **do not** send `location` — you send `latitude`/`longitude` and the
DB trigger derives `location` (file 01). You also don't need to send `status`,
`id`, timestamps, or `accepted_musician_ids` — the DB defaults them.

### The mapper layer (new, small, worth it)

The app model is camelCase (`src/types/index.ts`); rows are snake_case
(`src/supabase/types.ts`). Don't leak snake_case into components — add a tiny
`src/supabase/mappers.ts`:

```ts
import type { GigRow, GigInsert } from '@/supabase/types';
import type { Gig, CreateGigInput } from '@/types';

export const fromGigRow = (r: GigRow): Gig => ({
  id: r.id, title: r.title, venueName: r.venue_name,
  addressLine1: r.address_line1, addressLine2: r.address_line2 ?? undefined,
  city: r.city, postcode: r.postcode, country: r.country,
  latitude: r.latitude, longitude: r.longitude,
  date: r.date, startTime: r.start_time, endTime: r.end_time,
  genres: r.genres as Gig['genres'], pay: r.pay,
  description: r.description ?? '', status: r.status as Gig['status'],
  hosterId: r.hoster_id, acceptedMusicianIds: r.accepted_musician_ids,
});

export const toGigInsert = (i: CreateGigInput, hosterId: string): GigInsert => ({
  hoster_id: hosterId, title: i.title, venue_name: i.venueName,
  address_line1: i.addressLine1, address_line2: i.addressLine2 ?? null,
  city: i.city, postcode: i.postcode, country: i.country,
  latitude: 0, longitude: 0,                     // geocode fills these; see geocodeService
  date: i.date, start_time: i.startTime, end_time: i.endTime,
  genres: i.genres, pay: i.pay, description: i.description ?? null,
});
```

Write one `from*Row` / `to*Insert` pair per table as you convert it.

## Step 6 — make the contexts async

The contexts currently do `useState(MOCK_GIGS)` — synchronous. Live data is
fetched after mount. Pattern for `GigContext`:

```tsx
const [gigs, setGigs] = useState<Gig[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchGigs().then(setGigs).catch(console.error).finally(() => setLoading(false));
}, []);
```

In mock mode `fetchGigs()` resolves instantly with `MOCK_GIGS`, so behaviour is
unchanged except for one tick of `loading`. Expose `loading` so screens can show
a spinner. Then point the mutating actions (`createGig`, `acceptGig`,
`updateGigAcceptedMusicians`) at the async service writes, and after a successful
write either refetch or optimistically update local state.

Apply the same shape to the other contexts:

| Context | Reads | Writes |
|---------|-------|--------|
| `GigContext` | `fetchGigs`, `fetchHosterGigs` | `insertGig`, `updateGig` |
| `ApplicationContext` | `getApplicationsForGig`, `getApplicationsByMusician` → `.from('applications').select()` filtered | `submitApplication` → insert; `approveApplication`/`denyApplication` → update status |
| `ProfileContext` | `.from('profiles')` + `.from('musician_profiles')` | upsert on save; avatar via `supabase.storage.from('profile-pictures').upload(...)` |
| `NotificationContext` | `.from('notifications').select().eq('read', false)` for the badge | update `read` |

Convert them in dependency order: **Auth → Profile → Gig → Application →
Notification**, verifying each against the live DB before moving on. Because
unconverted services still return mocks, the app never breaks mid-migration.

## Step 7 — search uses the RPC (already wired)

`searchService.ts` is the finished reference: in mock mode it runs the in-memory
Haversine `searchGigs`; with a client it calls
`supabase.rpc('search_gigs', { p_user_lat, p_user_lng, ... })` and converts the
returned `distance_miles` straight through. You don't need to change it — it
starts working the moment the client is live and the RPC exists.

## Verifying reads/writes end to end

1. `supabase` is live (env vars set), you can sign in, and
   `supabase.auth.getSession()` returns a session with a `user.id`.
2. As that user, create a gig → a row appears in `gigs` with your `hoster_id`
   and a non-null `location` (confirms the trigger fired).
3. Sign in as a second user, apply to that gig → a `pending` row in
   `applications`; a **duplicate** apply fails with `23505` (the unique
   constraint — the app should show "already applied").
4. As the hoster, you can read that application (two-sided SELECT policy); as an
   unrelated third user you cannot (returns zero rows — RLS working).
5. `search_gigs` returns the gig with a sensible `distance_miles`.

If a write returns `new row violates row-level security policy`, the JWT's
`auth.uid()` doesn't match what the policy requires — nearly always because
you're inserting with the wrong user id or the session isn't what you think.

Next: [`05-testflight-readiness.md`](./05-testflight-readiness.md).
