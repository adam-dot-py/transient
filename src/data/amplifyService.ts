/**
 * Amplify recipient service — the "other half" of the Amplify feature.
 *
 * Amplify is Transient's Uber-style broadcast: a hoster pays to push a gig to
 * musicians nearby, and those musicians receive a gig-card alert they can apply
 * to or dismiss. This module answers the targeting question: GIVEN an amplified
 * gig and a radius, WHICH musicians should receive the push?
 *
 * ─── Architecture (mirrors src/data/searchService.ts) ────────────────────────
 * The core function (`getPushRecipients`) is pure and immutable — it never
 * mutates its inputs and has no side effects, so it is trivial to test with
 * Jest + fast-check and to reuse in the context/state layer.
 *
 * `fetchPushRecipients` is the mock-first async orchestrator. It mirrors
 * `searchService.fetchSearchResults` and `stripeService`: when no Supabase
 * client is configured it runs the pure in-memory path over the provided
 * musicians; when a client exists it delegates to the `amplify_recipients`
 * Postgres RPC, which performs the same radius + genre matching in the database
 * via PostGIS (`ST_DWithin`). Only this function touches `supabase`.
 *
 * ─── Units & semantics (aligned with the SQL boundary) ───────────────────────
 * - The app layer speaks MILES; the database speaks METERS (miles * 1609.344).
 *   Conversion happens only at the SQL/RPC boundary — see migration
 *   0002_amplify_recipients.sql.
 * - A musician with invalid/zero coordinates (`isValidCoordinate` === false) is
 *   treated as "no location" and is NEVER a recipient (same rule the gig radius
 *   filter uses in searchService).
 * - Radius is INCLUSIVE (distance <= radiusMiles), matching `ST_DWithin` and the
 *   searchService radius filter.
 * - Genre matching is OVERLAP: a musician is eligible if they play AT LEAST ONE
 *   of the gig's genres. When `matchGenres` is false (or the gig lists no
 *   genres) the genre gate is skipped and radius alone decides.
 * - The hoster who created the gig is never a recipient of their own push.
 * - Radius options reuse `AMPLIFY_CONFIG.radiusOptions` = [5, 10, 15, 25].
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { isValidCoordinate } from '@/data/gigService';
import { getDistanceMiles, type LatLng } from '@/data/searchService';
import { supabase } from '@/supabase/client';
import type { Database } from '@/supabase/types';
import type { Gig, Genre } from '@/types';

/**
 * The subset of a musician needed to decide push eligibility. A real
 * FullMusicianProfile (plus coordinates) satisfies this, as does a Supabase
 * musician_profiles row after mapping. Kept minimal so the pure matcher does
 * not depend on the full profile shape.
 */
export interface PushCandidate {
  /** The musician's profile id (profiles.id / auth.users.id in Supabase). */
  id: string;
  /** Genres the musician plays; used for overlap matching. */
  genres: Genre[];
  /** Musician's home latitude (degrees, WGS84). Undefined/null = no location. */
  latitude?: number | null;
  /** Musician's home longitude (degrees, WGS84). Undefined/null = no location. */
  longitude?: number | null;
}

/** A matched recipient paired with their distance (miles) from the gig. */
export interface PushRecipient {
  /** The musician's profile id. */
  musicianId: string;
  /** Great-circle distance from the gig to the musician, in miles. */
  distanceMiles: number;
}

/** Options controlling recipient matching. */
export interface PushMatchOptions {
  /** Inclusive broadcast radius in miles (e.g. one of AMPLIFY_CONFIG.radiusOptions). */
  radiusMiles: number;
  /**
   * When true (default), a musician must share at least one genre with the gig.
   * When false, or when the gig lists no genres, radius alone decides.
   */
  matchGenres?: boolean;
}

/**
 * Pure recipient matcher. Returns the musicians who should receive the amplified
 * gig, each with their distance in miles, SORTED nearest-first (ties broken by
 * musicianId for determinism).
 *
 * Pure: builds new arrays via map/filter/sort and never mutates its inputs.
 * Semantically aligned with the `amplify_recipients` RPC so the dev loop and the
 * database behave identically (same units, same inclusive radius, same genre
 * overlap, same "no location" exclusion, same sort order).
 *
 * A musician is a recipient when ALL hold:
 *   1. they are not the gig's hoster;
 *   2. they have a valid, non-zero coordinate;
 *   3. their distance to the gig is <= radiusMiles (inclusive);
 *   4. if genre matching is on and the gig has genres, they share >= 1 genre.
 */
export function getPushRecipients(
  gig: Gig,
  musicians: PushCandidate[],
  options: PushMatchOptions
): PushRecipient[] {
  const { radiusMiles } = options;
  const matchGenres = options.matchGenres ?? true;

  // A gig with no valid location cannot be broadcast by proximity.
  if (!isValidCoordinate(gig.latitude, gig.longitude)) {
    return [];
  }

  // Non-positive radius matches nobody (defensive; radii are always > 0).
  if (!(radiusMiles > 0)) {
    return [];
  }

  const gigPoint: LatLng = {
    latitude: gig.latitude,
    longitude: gig.longitude,
  };

  const useGenreGate = matchGenres && gig.genres.length > 0;

  const recipients: PushRecipient[] = [];

  for (const musician of musicians) {
    // 1. Never push a gig back to its own hoster.
    if (musician.id === gig.hosterId) continue;

    // 2. Musician must have a valid, non-zero location.
    const lat = musician.latitude;
    const lng = musician.longitude;
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      continue;
    }
    if (!isValidCoordinate(lat, lng)) continue;

    // 3. Radius (inclusive).
    const distanceMiles = getDistanceMiles(gigPoint, { latitude: lat, longitude: lng });
    if (distanceMiles > radiusMiles) continue;

    // 4. Genre overlap (any shared genre), when the gate is active.
    if (useGenreGate) {
      const shares = musician.genres.some((g) => gig.genres.includes(g));
      if (!shares) continue;
    }

    recipients.push({ musicianId: musician.id, distanceMiles });
  }

  // Sort nearest-first; deterministic tie-break on id.
  recipients.sort((a, b) => {
    if (a.distanceMiles !== b.distanceMiles) {
      return a.distanceMiles - b.distanceMiles;
    }
    return a.musicianId.localeCompare(b.musicianId);
  });

  return recipients;
}

// ─── RPC client narrowing (mirrors searchService) ────────────────────────────

/**
 * Minimal structural view of the Supabase client's `.rpc` method, typed against
 * the `amplify_recipients` Functions contract in `Database`. Used only to narrow
 * the client (which is `null`-typed until the real client is wired in
 * client.ts). Mirrors the SearchGigsFn narrowing in searchService.ts.
 */
type AmplifyRecipientsFn = Database['public']['Functions']['amplify_recipients'];
interface SupabaseRpcClient {
  rpc(
    fn: 'amplify_recipients',
    args: AmplifyRecipientsFn['Args']
  ): Promise<{
    data: AmplifyRecipientsFn['Returns'] | null;
    error: { message?: string } | null;
  }>;
}

/**
 * Backend-agnostic entry point for Amplify targeting.
 *
 * Mock-first: when no Supabase client is configured (local dev), it matches the
 * provided candidate musicians in memory via the pure `getPushRecipients`. When
 * a client exists, it delegates to the `amplify_recipients` RPC, which runs the
 * same radius + genre matching in Postgres (PostGIS `ST_DWithin`, miles→meters
 * at the boundary). The returned contract — `PushRecipient[]` — is identical in
 * both paths, so callers never branch on the backend.
 *
 * `candidates` is used only in the mock path; in the RPC path the database holds
 * the full musician set, so callers may pass an empty array for live mode.
 */
export async function fetchPushRecipients(
  gig: Gig,
  candidates: PushCandidate[],
  options: PushMatchOptions
): Promise<PushRecipient[]> {
  if (!supabase) {
    // Dev loop: match the provided candidates in memory.
    return getPushRecipients(gig, candidates, options);
  }

  // Narrow through a minimal structural RPC type so this branch type-checks
  // against the amplify_recipients Functions contract without the package being
  // installed yet (same pattern as searchService.fetchSearchResults).
  const client = supabase as unknown as SupabaseRpcClient;

  const matchGenres = options.matchGenres ?? true;
  const { data, error } = await client.rpc('amplify_recipients', {
    p_gig_id: gig.id,
    p_radius_miles: options.radiusMiles,
    p_match_genres: matchGenres,
  });

  if (error) {
    throw new Error(error.message ?? 'amplify_recipients failed');
  }

  return ((data ?? []) as AmplifyRecipientRow[]).map((row) => ({
    musicianId: row.musician_id,
    distanceMiles: row.distance_miles,
  }));
}

/**
 * Shape of a single row returned by the `amplify_recipients` RPC. Declared here
 * (rather than types.ts) to keep the Amplify contract co-located; re-exported
 * via the Database.Functions type for the client narrowing above.
 */
export interface AmplifyRecipientRow {
  musician_id: string;
  distance_miles: number;
}
