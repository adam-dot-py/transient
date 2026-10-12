/**
 * Pure gig search / filter / sort service for the Explore screen.
 *
 * ─── Architecture ────────────────────────────────────────────────────────────
 * The core functions (`getDistanceMiles`, `searchGigs`, `sortResults`) are
 * pure and immutable — they never mutate their inputs and have no side effects,
 * so they are trivial to test with Jest + fast-check and to reuse in the
 * context/state layer.
 *
 * `fetchSearchResults` is the mock-first async orchestrator. It mirrors
 * `src/services/stripeService.ts`: when no Supabase client is configured it runs
 * the pure in-memory path over the mock gigs; when a client exists it delegates
 * to the `search_gigs` Postgres RPC (which performs the same filtering + sorting
 * in the database via PostGIS). Only this function touches `supabase`.
 *
 * ─── Units & semantics (aligned with the SQL boundary) ───────────────────────
 * - The app layer speaks MILES; the database speaks METERS (miles * 1609.344).
 * - `isValidCoordinate` semantics: lat === 0 || lng === 0, or out of range, is
 *   treated as "no location". Such gigs carry `distanceMiles: null` and are only
 *   excluded when a radius filter is active.
 * - Radius options reuse `AMPLIFY_CONFIG.radiusOptions` = [5, 10, 15, 25].
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { isValidCoordinate } from '@/data/gigService';
import { MOCK_GIGS } from '@/data/mockGigs';
import { supabase } from '@/supabase/client';
import type { Database, GigRow, SearchGigRow } from '@/supabase/types';
import type { Genre, Gig } from '@/types';

/**
 * Minimal structural view of the Supabase client's `.rpc` method, typed against
 * the `search_gigs` Functions contract in `Database`. Used only to narrow the
 * client (which is `null`-typed until the real client is wired in client.ts).
 */
type SearchGigsFn = Database['public']['Functions']['search_gigs'];
interface SupabaseRpcClient {
  rpc(
    fn: 'search_gigs',
    args: SearchGigsFn['Args']
  ): Promise<{ data: SearchGigsFn['Returns'] | null; error: { message?: string } | null }>;
}

// ─── Types ─────────────────────────────────────────────────────────────────

/** The four supported sort modes. */
export type SortBy = 'distance' | 'payHighToLow' | 'payLowToHigh' | 'dateSoonest';

/** A geographic point in degrees (WGS84). */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Fully-specified search criteria driving the Explore results. */
export interface SearchCriteria {
  /** Free text; matched case-insensitively against title / venueName / city. */
  query: string;
  /** Selected genres; empty = no genre filter (OR / overlap semantics). */
  genres: Genre[];
  /** Inclusive lower pay bound; undefined = no lower bound. */
  minPay?: number;
  /** Inclusive upper pay bound; undefined = no upper bound. */
  maxPay?: number;
  /** Inclusive radius in miles; undefined = no distance filter. */
  maxDistanceMiles?: number;
  /** Sort mode applied to the filtered results. */
  sortBy: SortBy;
}

/** A gig paired with its computed distance (miles) from the user, if known. */
export interface GigWithDistance {
  gig: Gig;
  /** null when the gig has invalid/zero coordinates. */
  distanceMiles: number | null;
}

/** The default criteria: no filters, nearest-first. */
export const DEFAULT_SEARCH_CRITERIA: SearchCriteria = {
  query: '',
  genres: [],
  minPay: undefined,
  maxPay: undefined,
  maxDistanceMiles: undefined,
  sortBy: 'distance',
};

/** Miles → meters conversion factor used at the SQL boundary. */
export const METERS_PER_MILE = 1609.344;

/** Mean Earth radius in miles (SQL-aligned). */
const EARTH_RADIUS_MILES = 3958.7613;

// ─── getDistanceMiles ────────────────────────────────────────────────────────

/**
 * Great-circle distance between two points in miles (Haversine formula).
 *
 * Pure. Invariants: symmetric (d(a,b) ≈ d(b,a)), d(a,a) === 0, always >= 0.
 * Uses a sphere, whereas PostGIS `ST_Distance(geography)` uses the WGS84
 * spheroid; results differ by well under 0.5% — acceptable for the dev-loop
 * approximation (same units, same bounds, same order as the SQL path).
 */
export function getDistanceMiles(from: LatLng, to: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

// ─── sortResults ───────────────────────────────────────────────────────────

/**
 * Sorts gig results by the given mode. Pure: returns a new array and never
 * mutates the input.
 *
 * - distance: known distances ascending; null (no location) sorts last.
 * - payHighToLow / payLowToHigh: by numeric pay.
 * - dateSoonest: ISO YYYY-MM-DD compares lexicographically == chronologically.
 */
export function sortResults(
  items: GigWithDistance[],
  sortBy: SortBy
): GigWithDistance[] {
  const copy = [...items];
  switch (sortBy) {
    case 'distance':
      return copy.sort((a, b) => {
        if (a.distanceMiles === null && b.distanceMiles === null) return 0;
        if (a.distanceMiles === null) return 1;
        if (b.distanceMiles === null) return -1;
        return a.distanceMiles - b.distanceMiles;
      });
    case 'payHighToLow':
      return copy.sort((a, b) => b.gig.pay - a.gig.pay);
    case 'payLowToHigh':
      return copy.sort((a, b) => a.gig.pay - b.gig.pay);
    case 'dateSoonest':
      return copy.sort((a, b) => a.gig.date.localeCompare(b.gig.date));
    default:
      return copy;
  }
}

// ─── searchGigs ──────────────────────────────────────────────────────────────

/**
 * Filters and sorts gigs in memory according to the supplied criteria.
 *
 * Pure: produces new arrays via map/filter/sort and never mutates its inputs.
 * Semantically aligned with the `search_gigs` RPC so the dev loop and the
 * database behave identically (same units, same inclusive bounds, same order).
 *
 * @param gigs          the candidate gigs (typically available gigs only)
 * @param userLocation  the user's current position
 * @param criteria      the search / filter / sort criteria
 */
export function searchGigs(
  gigs: Gig[],
  userLocation: LatLng,
  criteria: SearchCriteria
): GigWithDistance[] {
  const q = criteria.query.trim().toLowerCase();

  // 1. Compute distance once per gig (null for invalid/zero coords).
  const withDistance: GigWithDistance[] = gigs.map((gig) => ({
    gig,
    distanceMiles: isValidCoordinate(gig.latitude, gig.longitude)
      ? getDistanceMiles(userLocation, {
          latitude: gig.latitude,
          longitude: gig.longitude,
        })
      : null,
  }));

  // 2. Filter.
  const filtered = withDistance.filter(({ gig, distanceMiles }) => {
    // Text: case-insensitive substring over title / venueName / city.
    if (q.length > 0) {
      const haystack = `${gig.title} ${gig.venueName} ${gig.city}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    // Genre overlap: gig passes if it has ANY of the selected genres.
    if (criteria.genres.length > 0) {
      const hit = gig.genres.some((g) => criteria.genres.includes(g));
      if (!hit) return false;
    }
    // Pay range (inclusive).
    if (criteria.minPay !== undefined && gig.pay < criteria.minPay) return false;
    if (criteria.maxPay !== undefined && gig.pay > criteria.maxPay) return false;
    // Radius (inclusive). Invalid coords excluded only when a radius is set.
    if (criteria.maxDistanceMiles !== undefined) {
      if (distanceMiles === null) return false;
      if (distanceMiles > criteria.maxDistanceMiles) return false;
    }
    return true;
  });

  // 3. Sort (returns a new array; never mutates `filtered`).
  return sortResults(filtered, criteria.sortBy);
}

// ─── Row → domain mapping (RPC path) ─────────────────────────────────────────

/**
 * Maps a snake_case Supabase gig row to the camelCase domain `Gig`.
 * Keeps snake_case shapes out of components (per backend steering).
 */
export function mapRowToGig(row: GigRow): Gig {
  return {
    id: row.id,
    title: row.title,
    venueName: row.venue_name,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? undefined,
    city: row.city,
    postcode: row.postcode,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    genres: row.genres as Genre[],
    pay: row.pay,
    description: row.description ?? '',
    status: row.status as Gig['status'],
    hosterId: row.hoster_id,
    acceptedMusicianIds: row.accepted_musician_ids,
  };
}

// ─── fetchSearchResults (mock-first + RPC) ───────────────────────────────────

/**
 * Backend-agnostic entry point for the Explore screen.
 *
 * Mock-first: when no Supabase client is configured (local dev), it filters the
 * available mock gigs in memory via the pure `searchGigs`. When a client exists,
 * it delegates to the `search_gigs` RPC, which runs the same filtering + sorting
 * in Postgres (PostGIS `ST_DWithin` / `ST_Distance`, miles→meters at the
 * boundary). The returned contract — `GigWithDistance[]` — is identical in both
 * paths, so the UI never needs to branch on the backend.
 */
export async function fetchSearchResults(
  userLocation: LatLng,
  criteria: SearchCriteria
): Promise<GigWithDistance[]> {
  if (!supabase) {
    // Dev loop: filter the available mock gigs in memory.
    const available = MOCK_GIGS.filter((g) => g.status === 'available');
    return searchGigs(available, userLocation, criteria);
  }

  // `supabase` from the client module is typed as `null` until the real
  // @supabase/supabase-js client is wired in client.ts (see stripeService.ts
  // for the same pattern). Narrow through a minimal structural RPC type so this
  // branch type-checks against the search_gigs Functions contract without
  // depending on the package being installed yet.
  const client = supabase as unknown as SupabaseRpcClient;

  const { data, error } = await client.rpc('search_gigs', {
    p_user_lat: userLocation.latitude,
    p_user_lng: userLocation.longitude,
    p_query: criteria.query.trim() || null,
    p_genres: criteria.genres.length ? criteria.genres : null,
    p_min_pay: criteria.minPay ?? null,
    p_max_pay: criteria.maxPay ?? null,
    p_max_distance_miles: criteria.maxDistanceMiles ?? null,
    p_sort_by: criteria.sortBy,
  });

  if (error) {
    throw new Error(error.message ?? 'search_gigs failed');
  }

  return ((data ?? []) as SearchGigRow[]).map((row) => ({
    gig: mapRowToGig(row),
    distanceMiles: row.distance_miles,
  }));
}
