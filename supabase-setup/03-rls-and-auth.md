# 03 — RLS and auth (read this before wiring the app)

This is the part most likely to trip up someone coming from pure data
engineering, because it couples the *database* to the *identity system* in a way
a plain Postgres project doesn't. Get this right and reads/writes "just work";
get it wrong and every query silently returns zero rows.

## The one sentence to internalise

> Every Transient table has **Row Level Security (RLS) enabled**, and the
> policies are written against **`auth.uid()`** — the UUID of the logged-in
> user, taken from the JWT that **Supabase Auth** issues at login. No valid JWT
> ⇒ `auth.uid()` is NULL ⇒ the policies deny everything.

So the app can only read and write once a user is **genuinely authenticated by
Supabase**. The current mock auth (`AuthContext` hands out a fake token) does
**not** produce a real JWT, so it cannot satisfy a single policy against the
real database. Replacing mock auth with real Supabase Auth is therefore step one
of "connect for reads and writes" — not an afterthought.

## How the pieces connect

```
User taps "Sign in with Apple"
      │
      ▼
supabase.auth.signInWithOAuth(...) / signInWithPassword(...)
      │  Supabase Auth verifies, creates a row in auth.users,
      │  returns a session { access_token (JWT), user: { id } }
      ▼
supabase-js stores the session (AsyncStorage) and attaches the JWT
as a Bearer token on every subsequent PostgREST / RPC / Storage call
      │
      ▼
Postgres reads auth.uid() from the JWT → RLS policies evaluate →
rows the user is allowed to see/change are returned; everything else is denied
```

The key consequence: **you don't pass user ids around for authorization.** You
don't write `WHERE hoster_id = $myId` to be safe — the policy does that for you.
The app still *sends* ids for data purposes (which gig to insert), but the
database is what decides whether you're allowed.

## `profiles` is the join between `auth.users` and your data

- `auth.users` is Supabase's table (you don't create or query it directly from
  the app). It holds email, provider, hashed password, the UUID.
- `profiles.id` **equals** `auth.users.id`. This is the bridge: your domain
  tables FK to `profiles`, and policies compare `auth.uid()` (from `auth.users`)
  to those profile-derived columns.

**Therefore: a profile row must exist for every auth user.** The moment someone
signs up, you must create their `profiles` row (and, for musicians, their
`musician_profiles` row). Two robust options:

1. **A database trigger on `auth.users`** (recommended — can't be skipped):

   ```sql
   create or replace function public.handle_new_user()
   returns trigger language plpgsql security definer set search_path = '' as $$
   begin
     insert into public.profiles (id, display_name, role)
     values (
       new.id,
       coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
       coalesce(new.raw_user_meta_data->>'role', 'musician')
     );
     return new;
   end; $$;

   drop trigger if exists on_auth_user_created on auth.users;
   create trigger on_auth_user_created
     after insert on auth.users
     for each row execute function public.handle_new_user();
   ```

   This is `SECURITY DEFINER` on purpose — it runs as the function owner so it
   can insert into `profiles` during sign-up before the user's own session
   exists. The empty `search_path` is a hardening best practice.

2. **Client-side after sign-up:** immediately `insert` into `profiles` from the
   app once the session exists. Simpler to reason about, but skippable if a
   sign-up path forgets to call it — which is why the trigger is safer.

> **Recommendation:** use the trigger for `profiles`, and have the app upsert
> `musician_profiles` the first time a musician opens the profile editor (the
> role/genres aren't known at sign-up).

## Reading the policies (what each table allows)

The policies are already defined in the schema. Summary of the authorization
model so you can reason about it:

| Table | Read | Write |
|-------|------|-------|
| `profiles` | **anyone** (`USING (true)`) | only your own row (`auth.uid() = id`) |
| `musician_profiles` | any authenticated user | only your own row |
| `gigs` | any authenticated user | only the **hoster** who owns the gig (insert/update/delete) |
| `example_songs` | any authenticated user | only the gig's hoster (via `EXISTS` subquery on `gigs`) |
| `applications` | the **musician** who applied, **or** the **hoster** of the gig | musician can insert their own; hoster can update status |
| `push_tokens` | only your own | only your own |
| `notifications` | only your own | only your own (update, e.g. mark read) |
| `amplify_payments` | only your own | only your own (insert) |

Two things worth calling out for your mental model:

- **`profiles` is world-readable by design.** Hosts need to see a musician's
  public profile when reviewing applications, so SELECT is open. Nothing
  sensitive lives there (no email — that's in `auth.users`).
- **`applications` has two SELECT policies.** Postgres RLS policies are **OR-ed**
  within the same command, so a row is visible if *either* "I'm the musician"
  *or* "I'm the hoster of this gig" holds. That's exactly the two-sided view the
  app needs.

## Testing policies without the app

Use the SQL editor's **"Run as"** / impersonation, or test from `psql` by
setting the role and claims. A quick sanity check that RLS is actually on and
denying anon:

```sql
-- As the anon role (no JWT), this should return 0 rows even if gigs exist,
-- because the gigs SELECT policy requires auth.role() = 'authenticated'.
set role anon;
select count(*) from gigs;
reset role;
```

If that returns your seeded rows as `anon`, RLS isn't doing what you think —
re-check that `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` ran.

## Auth providers you'll configure (matches the login screen)

The app's login screen already has **Apple, Google, Facebook** buttons plus
email/password (see `src/app/(auth)/login.tsx`). In Supabase → **Authentication
→ Providers**, enable:

- **Email** (works out of the box; consider disabling "confirm email" for beta
  so testers aren't blocked on inbox confirmation — re-enable for production).
- **Apple** — required for App Store if you offer any other social login
  (Apple's guideline). Needs a Services ID + key from your Apple Developer
  account.
- **Google** — OAuth client id/secret from Google Cloud console.
- **Facebook** — app id/secret from Meta.

For OAuth on a native app you also set the **redirect URL** to the app's scheme.
The app's scheme is `transient` (from `app.json`), so the redirect is
`transient://...`; add it to each provider's allowed redirects and to Supabase →
Authentication → URL Configuration. `expo-web-browser` (already a dependency)
handles the OAuth round-trip.

> **For the very first TestFlight pass**, email/password alone is enough to
> validate the end-to-end flow. Add the social providers once the data path is
> proven — they're independent of the schema.

Next: [`04-connect-the-app.md`](./04-connect-the-app.md) — install the client,
set env vars, and convert the service layer from mock to live.
