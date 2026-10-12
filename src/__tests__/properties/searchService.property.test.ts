/**
 * Property-based tests for searchService (Jest + fast-check).
 *
 * Validates the invariants of the pure search/filter/sort layer that backs the
 * Explore screen:
 *  - getDistanceMiles: symmetry, non-negativity, zero on identity.
 *  - genre / pay / radius filters: every result satisfies the predicate.
 *  - all four sort modes: output is correctly ordered AND is a permutation of
 *    the filtered input (no drops / dupes).
 */

import {
  getDistanceMiles,
  type LatLng,
  type SearchCriteria,
  searchGigs,
  type SortBy,
} from '@/data/searchService';
import type { Genre, Gig } from '@/types';
import fc from 'fast-check';

// ─── Constants & arbitraries ─────────────────────────────────────────────────

const ALL_GENRES: Genre[] = [
  'rock',
  'jazz',
  'blues',
  'electronic',
  'folk',
  'classical',
  'pop',
  'country',
];

const USER: LatLng = { latitude: 36.1627, longitude: -86.7816 };

/** Bounded, well-formed lat/lng (avoids the zero-coord "no location" rule). */
const latArb = fc.double({ min: -89, max: 89, noNaN: true, noDefaultInfinity: true });
const lngArb = fc.double({ min: -179, max: 179, noNaN: true, noDefaultInfinity: true });

/** Arbitrary gig with randomized sortable/filterable fields. */
const gigArb = fc.record({
  id: fc.uuid(),
  pay: fc.integer({ min: 1, max: 99999 }),
  genres: fc.subarray(ALL_GENRES, { minLength: 1 }),
  latitude: fc.oneof(latArb, fc.constant(0)), // sometimes "no location"
  longitude: fc.oneof(lngArb, fc.constant(0)),
  date: fc
    .integer({ min: 0, max: 3650 })
    .map((d) => new Date(2099, 0, 1 + d).toISOString().split('T')[0]),
}).map(
  (r): Gig => ({
    id: r.id,
    title: 'Gig',
    venueName: 'Venue',
    addressLine1: '1 St',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37201',
    country: 'USA',
    latitude: r.latitude,
    longitude: r.longitude,
    date: r.date,
    startTime: '20:00',
    endTime: '23:00',
    genres: r.genres,
    pay: r.pay,
    description: '',
    status: 'available',
    hosterId: 'hoster-1',
    acceptedMusicianIds: [],
  })
);

const gigsArb = fc.array(gigArb, { maxLength: 20 });

function baseCriteria(overrides: Partial<SearchCriteria> = {}): SearchCriteria {
  return {
    query: '',
    genres: [],
    minPay: undefined,
    maxPay: undefined,
    maxDistanceMiles: undefined,
    sortBy: 'distance',
    ...overrides,
  };
}

// ─── getDistanceMiles ──────────────────────────────────────────────────────────

describe('Property: getDistanceMiles invariants', () => {
  it('is symmetric and non-negative, zero on identity', () => {
    fc.assert(
      fc.property(latArb, lngArb, latArb, lngArb, (lat1, lng1, lat2, lng2) => {
        const a: LatLng = { latitude: lat1, longitude: lng1 };
        const b: LatLng = { latitude: lat2, longitude: lng2 };
        const d = getDistanceMiles(a, b);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeCloseTo(getDistanceMiles(b, a), 6);
        expect(getDistanceMiles(a, a)).toBeCloseTo(0, 6);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Genre filter ─────────────────────────────────────────────────────────────

describe('Property: genre filter overlap', () => {
  it('every result shares at least one selected genre', () => {
    fc.assert(
      fc.property(gigsArb, fc.subarray(ALL_GENRES, { minLength: 1 }), (gigs, genres) => {
        const results = searchGigs(gigs, USER, baseCriteria({ genres }));
        for (const { gig } of results) {
          expect(gig.genres.some((g) => genres.includes(g))).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Pay range ─────────────────────────────────────────────────────────────────

describe('Property: pay range is inclusive', () => {
  it('every result has pay within [min, max]', () => {
    fc.assert(
      fc.property(
        gigsArb,
        fc.integer({ min: 1, max: 99999 }),
        fc.integer({ min: 1, max: 99999 }),
        (gigs, p1, p2) => {
          const minPay = Math.min(p1, p2);
          const maxPay = Math.max(p1, p2);
          const results = searchGigs(gigs, USER, baseCriteria({ minPay, maxPay }));
          for (const { gig } of results) {
            expect(gig.pay).toBeGreaterThanOrEqual(minPay);
            expect(gig.pay).toBeLessThanOrEqual(maxPay);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Radius filter ───────────────────────────────────────────────────────────

describe('Property: radius filter', () => {
  it('when a radius is set, every result has a known distance within it', () => {
    fc.assert(
      fc.property(gigsArb, fc.constantFrom(5, 10, 15, 25), (gigs, maxDistanceMiles) => {
        const results = searchGigs(gigs, USER, baseCriteria({ maxDistanceMiles }));
        for (const { distanceMiles } of results) {
          expect(distanceMiles).not.toBeNull();
          expect(distanceMiles as number).toBeLessThanOrEqual(maxDistanceMiles);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Sorting ────────────────────────────────────────────────────────────────

const sortModes: SortBy[] = ['distance', 'payHighToLow', 'payLowToHigh', 'dateSoonest'];

describe('Property: sorting is correctly ordered and a permutation', () => {
  it('preserves the filtered multiset and orders each mode correctly', () => {
    fc.assert(
      fc.property(gigsArb, fc.constantFrom(...sortModes), (gigs, sortBy) => {
        const results = searchGigs(gigs, USER, baseCriteria({ sortBy }));

        // Permutation of the full input (no filters applied → same ids).
        expect(results.map((r) => r.gig.id).sort()).toEqual(gigs.map((g) => g.id).sort());

        // Ordering check per mode.
        for (let i = 1; i < results.length; i++) {
          const prev = results[i - 1];
          const cur = results[i];
          switch (sortBy) {
            case 'payHighToLow':
              expect(prev.gig.pay).toBeGreaterThanOrEqual(cur.gig.pay);
              break;
            case 'payLowToHigh':
              expect(prev.gig.pay).toBeLessThanOrEqual(cur.gig.pay);
              break;
            case 'dateSoonest':
              expect(prev.gig.date <= cur.gig.date).toBe(true);
              break;
            case 'distance':
              // null distances sort last; known distances ascending.
              if (prev.distanceMiles === null) {
                expect(cur.distanceMiles).toBeNull();
              } else if (cur.distanceMiles !== null) {
                expect(prev.distanceMiles).toBeLessThanOrEqual(cur.distanceMiles);
              }
              break;
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
