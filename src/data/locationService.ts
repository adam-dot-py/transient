/**
 * Location Service — the user-controlled search origin for the Explore screen.
 *
 * ─── Responsibilities ────────────────────────────────────────────────────────
 * 1. Device GPS   — `getDeviceLocation()` asks for foreground location
 *    permission, reads the current position via `expo-location`, and
 *    reverse-geocodes it to a human label.
 * 2. Manual entry — `resolveManualLocation(city)` turns a typed city name into
 *    coordinates + label via the mock geocoder.
 *
 * ─── Mock-first / resilient design ───────────────────────────────────────────
 * `expo-location` is a native module: it is imported lazily so that this file
 * (and the Jest unit tests + the `supabase === null` dev loop) never crash when
 * the module or a device GPS is unavailable. Every device call returns a
 * discriminated `LocationResult` instead of throwing, so the UI can show a
 * precise reason ("permission denied", "unavailable") and fall back to the
 * default or manual entry.
 *
 * The resolved `UserLocation` feeds `searchService` as the search origin and, in
 * the Supabase path, becomes the `p_user_lat` / `p_user_lng` arguments of the
 * `search_gigs` RPC — no schema change is required for this feature.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { requireOptionalNativeModule } from 'expo-modules-core';

import { geocodeCity, reverseGeocode } from '@/data/geocodeService';

// ─── Types ─────────────────────────────────────────────────────────────────

/** A resolved search origin: coordinates plus a short display label. */
export interface UserLocation {
  latitude: number;
  longitude: number;
  /** Human-readable label shown in the SearchBar, e.g. "Nashville, TN". */
  label: string;
  /** How this location was obtained. */
  source: 'default' | 'device' | 'manual';
}

/** Discriminated result of a location request — never throws to the caller. */
export type LocationResult =
  | { ok: true; location: UserLocation }
  | { ok: false; reason: LocationError };

export type LocationError =
  | 'permission-denied'
  | 'unavailable'
  | 'not-found'
  | 'empty';

/** The app's default origin (Nashville, TN) — matches the mock gig cluster. */
export const DEFAULT_USER_LOCATION: UserLocation = {
  latitude: 36.1627,
  longitude: -86.7816,
  label: 'Nashville, TN',
  source: 'default',
};

// ─── Device GPS (expo-location) ──────────────────────────────────────────────

/**
 * Minimal structural view of the parts of `expo-location` we use.
 */
interface ExpoLocationModule {
  requestForegroundPermissionsAsync(): Promise<{ status: string }>;
  getCurrentPositionAsync(opts?: object): Promise<{
    coords: { latitude: number; longitude: number };
  }>;
  reverseGeocodeAsync?(point: {
    latitude: number;
    longitude: number;
  }): Promise<{ city?: string | null; subregion?: string | null; region?: string | null }[]>;
}

/**
 * Safely obtain the `expo-location` module.
 *
 * `expo-location` is a NATIVE module. If it is present in `node_modules` but the
 * running native binary was built BEFORE it was added (no `ExpoLocation` pod /
 * Android module), then importing `expo-location` throws at the package's
 * top level — `expo-location/build/ExpoLocation.js` calls
 * `requireNativeModule('ExpoLocation')` during its own module evaluation, which
 * a try/catch around `require()` cannot reliably contain in the dev client.
 *
 * So we FIRST probe the native registry with `requireOptionalNativeModule`,
 * which returns `null` (never throws) when the native side is missing. Only when
 * the native module is actually present do we `require('expo-location')` and use
 * its typed JS API. This guarantees "Use my location" degrades to a clean
 * `unavailable` result until a fresh native build (expo prebuild / run:ios)
 * includes the module.
 */
function getExpoLocation(): ExpoLocationModule | null {
  try {
    // Probe the native module registry WITHOUT importing expo-location's JS
    // (whose top-level evaluation throws when the native binary lacks it).
    const nativeModule = requireOptionalNativeModule('ExpoLocation');
    if (!nativeModule) {
      return null;
    }

    // Native side is present — safe to load the JS wrapper now.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-location') as ExpoLocationModule;
    if (
      !mod ||
      typeof mod.requestForegroundPermissionsAsync !== 'function' ||
      typeof mod.getCurrentPositionAsync !== 'function'
    ) {
      return null;
    }
    return mod;
  } catch {
    // Any failure (module missing, registry probe error) → treat as unavailable.
    return null;
  }
}

/**
 * Request the device's current location and resolve it to a {@link UserLocation}.
 *
 * Returns a {@link LocationResult} rather than throwing:
 * - `unavailable` when the native module is missing or GPS can't be read;
 * - `permission-denied` when the user declines the OS prompt;
 * - `ok` with a reverse-geocoded label otherwise.
 */
export async function getDeviceLocation(): Promise<LocationResult> {
  const Location = getExpoLocation();
  if (!Location) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, reason: 'permission-denied' };
    }

    const { coords } = await Location.getCurrentPositionAsync({});
    const label = await labelForCoords(Location, coords.latitude, coords.longitude);

    return {
      ok: true,
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        label,
        source: 'device',
      },
    };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/**
 * Produce a human label for coordinates. Prefers expo-location's native
 * reverse geocoder when available, falls back to the mock reverseGeocode, and
 * finally to a generic label — never throws.
 */
async function labelForCoords(
  Location: ExpoLocationModule,
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    if (typeof Location.reverseGeocodeAsync === 'function') {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        const parts = [place.city ?? place.subregion, place.region].filter(
          (p): p is string => !!p && p.length > 0
        );
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    }
  } catch {
    // fall through to the mock
  }
  return (await reverseGeocode(latitude, longitude)) ?? 'Current location';
}

// ─── Manual city entry ───────────────────────────────────────────────────────

/**
 * Resolve a typed city name into a {@link UserLocation} via the mock geocoder.
 *
 * Returns `empty` for a blank string and `not-found` for an unknown city, so
 * the UI can keep the current origin and surface a helpful message instead of
 * snapping to a default.
 */
export async function resolveManualLocation(city: string): Promise<LocationResult> {
  if (city.trim().length === 0) {
    return { ok: false, reason: 'empty' };
  }

  const result = await geocodeCity(city);
  if (!result) {
    return { ok: false, reason: 'not-found' };
  }

  return {
    ok: true,
    location: {
      latitude: result.latitude,
      longitude: result.longitude,
      label: result.formattedAddress,
      source: 'manual',
    },
  };
}

/** Human-readable copy for each {@link LocationError}. */
export function describeLocationError(reason: LocationError): string {
  switch (reason) {
    case 'permission-denied':
      return 'Location permission denied. Enable it in Settings or enter a city.';
    case 'unavailable':
      return "Couldn't read your device location. Try entering a city instead.";
    case 'not-found':
      return "We couldn't find that city. Try another nearby city.";
    case 'empty':
      return 'Enter a city to search that area.';
    default:
      return 'Something went wrong finding that location.';
  }
}
