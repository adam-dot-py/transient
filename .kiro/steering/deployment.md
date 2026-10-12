# Deployment & Release

How Transient is built, tested on real devices, and shipped to TestFlight / stores.
This complements `tech.md` (stack) and `product.md` (the CI/CD intent).

## Workflow model: managed + prebuild

Transient uses Expo's **managed workflow with prebuild**. The native projects
(`/ios`, `/android`) are **gitignored** and generated on demand from `app.json`
+ the config plugins. Consequences:

- **Do not commit `/ios` or `/android`.** Treat them as build output.
- Native config (permissions, plugins, identifiers) lives in `app.json`, not in
  hand-edited native files. If you edit a native file directly, a future
  `prebuild` will overwrite it.
- **Adding any `expo-*` native module requires a new native build** — a JS
  reload will not pick it up. Locally that means `npx expo run:ios`; for shared
  builds it means a new EAS build. (See the `expo-location` pattern: guard
  native modules with `requireOptionalNativeModule` so a stale binary degrades
  gracefully instead of crashing — `src/data/locationService.ts`.)

## Identifiers (source of truth: `app.json`)

- `ios.bundleIdentifier`: `com.adamdotpy.transient`
- `android.package`: `com.adamdotpy.transient`
- EAS project id: `b750cc2e-ec1f-417c-a903-c80c79141894`, owner `transient`
- App version (`expo.version`) is the marketing version (e.g. `1.0.0`).
- **Build numbers are managed remotely by EAS** (`eas.json` → `cli.appVersionSource: "remote"`,
  production `autoIncrement: true`). Do not hand-bump `ios.buildNumber` /
  `android.versionCode`; EAS increments them per production build.

## Build profiles (`eas.json`)

| Profile | Distribution | Use |
|---------|--------------|-----|
| `development` | internal | Dev client build for a registered device; hot-reload against your Metro server. Install once, iterate in JS. |
| `preview` | internal | Standalone, release-like build shared with teammates via an install link (ad-hoc / internal). No Metro needed. |
| `preview-simulator` | — | Same as preview but for the iOS Simulator (`.app` you can drag in). |
| `production` | store | TestFlight / App Store / Play Store submission. Auto-increments build number. |

`channel` maps each profile to an EAS Update channel so OTA JS updates can target
the right audience.

## On-device development (fastest iteration)

1. Install the dev client once: `npx expo install expo-dev-client` (adds the dev
   client so custom native modules work on device).
2. Register your device & build:
   `eas device:create` then `eas build --profile development --platform ios`.
3. Install the resulting build on your phone (QR / link), then run
   `npx expo start --dev-client` and scan — JS reloads live on the device.

Use this loop whenever native modules (maps, location) are involved, since Expo
Go cannot host custom native modules.

## Sharing a build with the team (no Apple review)

**iOS internal distribution** (quickest to share pre-TestFlight):
1. `eas device:create` — have each teammate register their device UDID via the
   link (ad-hoc provisioning covers up to 100 devices).
2. `eas build --profile preview --platform ios`.
3. Share the install link EAS returns. Teammates install directly.

## TestFlight (wider, no per-device registration)

Prerequisites (one-time, done by you — require your Apple account):
- **Apple Developer Program** membership (paid).
- An App Store Connect app record for `com.adamdotpy.transient`.
- Fill `eas.json` → `submit.production.ios` with your real `ascAppId`
  (App Store Connect app id) and `appleTeamId`.

Steps:
1. `eas build --profile production --platform ios`
2. `eas submit --profile production --platform ios` (EAS can create/manage the
   App Store Connect API key and upload the build).
3. In App Store Connect → TestFlight: once processing finishes, add internal
   testers (your team) — internal testing needs no Beta App Review. External
   testers require a short review.
4. Testers install the **TestFlight** app and accept your invite.

Combined build+submit: `eas build --profile production --platform ios --auto-submit`.

## Secrets & environment

- Client env vars use the `EXPO_PUBLIC_` prefix (e.g. `EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`). See
  `BACKEND_SETUP.md` (gitignored).
- For cloud builds, set these as **EAS environment variables / secrets** per
  profile (`eas env:create` or the EAS dashboard) rather than committing a
  `.env`. `.env*.local` is gitignored.
- Never commit Apple API keys, Stripe secret keys, or Supabase service-role keys.
  Edge Function secrets stay in Supabase (`supabase secrets set`), not in the app.

## OTA updates (JS-only changes)

JS/asset-only changes can ship without a store review via EAS Update:
`eas update --branch <channel> --message "..."`. Native changes (new native
module, permission, SDK bump, icon) require a **new build**, not an OTA update.

## Versioning rules

- Bump `expo.version` (marketing version) for user-facing releases (semver).
- Let EAS own the build number (remote + autoIncrement).
- Tag releases in git to match the submitted `version`.

## CI/CD (planned — see `product.md`)

GitHub Actions on push to `main` (paths `src/*`, `assets/*`): lint + typecheck +
jest, then EAS build/submit sequentially to test then prod. Use an `EXPO_TOKEN`
repo secret for non-interactive `eas` auth. Not yet implemented
(`.github/workflows/` does not exist).

## Pre-flight checklist for any shared/TestFlight build

- [ ] `app.json` identifiers, version, permissions, and plugins correct.
- [ ] `npx tsc --noEmit`, `npx jest`, and `npx expo export` clean.
- [ ] Any new native module rebuilt (not just JS-reloaded) and guarded.
- [ ] Required env/secrets set as EAS env vars for the target profile.
- [ ] `expo.version` bumped if user-facing; build number left to EAS.
- [ ] For TestFlight: `submit.production.ios.ascAppId` / `appleTeamId` filled.
