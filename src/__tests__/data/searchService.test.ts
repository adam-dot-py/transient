/**
 * Unit tests for searchService pure functions.
 *
 * Covers getDistanceMiles, searchGigs (text/genre/pay/distance filters),
 * all four sort modes, immutability, and edge cases. Semantically mirrors the
 * `search_gigs` RPC the dev loop stands in for.
 */

import {
  DEFAULT_SEARCH_CRITERIA,
  getDistanceMiles,
  type GigWithDistance,
  type LatLng,
  type SearchCriteria,
  searchGigs,
  sortResults,
} from '@/data/searchService';
import type { Gig } from '@/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Nashville city center — the mock user location. */
const USER: LatLng = { latitude: 36.1627, longitude: -86.7816 };

function makeGig(overrides: Partial<Gig> = {}): Gig {
  return {
    id: 'gig-1',
    title: 'Friday Night Rock Showcase',
    venueName: 'The Bluebird Cafe',
    addressLine1: '4104 Hillsboro Pike',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37215',
    country: 'USA',
    latitude: 36.1627,
    longitude: -86.7816,
    date: '2099-01-01',
    startTime: '20:00',
    endTime: '23:00',
    genres: ['rock'],
    pay: 250,
    description: 'A test gig',
    status: 'available',
    hosterId: 'hoster-1',
    acceptedMusicianIds: [],
    ...overrides,
  };
}

/** Build a criteria object from partial overrides on top of the default. */
function criteria(overrides: Partial<SearchCriteria> = {}): SearchCriteria {
  return { ...DEFAULT_SEARCH_CRITERIA, ...overrides };
}

// ─── getDistanceMiles ──────────────────────────────────────────────────────────

describe('getDistanceMiles', () => {
  it('returns 0 for identical points', () => {
    expect(getDistanceMiles(USER, USER)).toBe(0);
  });

  it('computes a known Nashville distance within tolerance', () => {
    // Bluebird Cafe (~36.1065, -86.8168) vs Nashville center.
    const bluebird: LatLng = { latitude: 36.1065, longitude: -86.8168 };
    // Great-circle distance is ~4.2 miles.
    expect(getDistanceMiles(USER, bluebird)).toBeCloseTo(4.2, 0);
  });

  it('is symmetric', () => {
    const a: LatLng = { latitude: 40.0, longitude: -80.0 };
    const b: LatLng = { latitude: 41.0, longitude: -81.0 };
    expect(getDistanceMiles(a, b)).toBeCloseTo(getDistanceMiles(b, a), 6);
  });

  it('is always non-negative', () => {
    const a: LatLng = { latitude: -10, longitude: 20 };
    const b: LatLng = { latitude: 30, longitude: -40 };
    expect(getDistanceMiles(a, b)).toBeGreaterThanOrEqual(0);
  });
});

// ─── Text filter ────────────────────────────────────────────────────────────

describe('searchGigs — text filter', () => {
  const gigs = [
    makeGig({ id: 'a', title: 'Jazz Brunch Session', venueName: 'Rudy', city: 'Nashville' }),
    makeGig({ id: 'b', title: 'Rock Showcase', venueName: 'Exit/In', city: 'Memphis' }),
  ];

  it('matches on title case-insensitively', () => {
    const r = searchGigs(gigs, USER, criteria({ query: 'JAZZ' }));
    expect(r.map((x) => x.gig.id)).toEqual(['a']);
  });

  it('matches on venueName case-insensitively', () => {
    const r = searchGigs(gigs, USER, criteria({ query: 'exit' }));
    expect(r.map((x) => x.gig.id)).toEqual(['b']);
  });

  it('matches on city case-insensitively', () => {
    const r = searchGigs(gigs, USER, criteria({ query: 'memphis' }));
    expect(r.map((x) => x.gig.id)).toEqual(['b']);
  });

  it('matches partial substrings', () => {
    const r = searchGigs(gigs, USER, criteria({ query: 'brunch' }));
    expect(r.map((x) => x.gig.id)).toEqual(['a']);
  });

  it('empty query returns all gigs', () => {
    const r = searchGigs(gigs, USER, criteria({ query: '' }));
    expect(r).toHaveLength(2);
  });

  it('whitespace-only query is treated as empty', () => {
    const r = searchGigs(gigs, USER, criteria({ query: '   ' }));
    expect(r).toHaveLength(2);
  });

  it('query with no match returns []', () => {
    const r = searchGigs(gigs, USER, criteria({ query: 'zzzznope' }));
    expect(r).toEqual([]);
  });
});

// ─── Genre filter ─────────────────────────────────────────────────────────────

describe('searchGigs — genre filter', () => {
  const gigs = [
    makeGig({ id: 'rock', genres: ['rock'] }),
    makeGig({ id: 'jazz', genres: ['jazz'] }),
    makeGig({ id: 'mix', genres: ['folk', 'country'] }),
  ];

  it('single genre returns only matching gigs', () => {
    const r = searchGigs(gigs, USER, criteria({ genres: ['jazz'] }));
    expect(r.map((x) => x.gig.id)).toEqual(['jazz']);
  });

  it('multiple genres use OR / overlap semantics', () => {
    const r = searchGigs(gigs, USER, criteria({ genres: ['jazz', 'folk'] }));
    expect(r.map((x) => x.gig.id).sort()).toEqual(['jazz', 'mix']);
  });

  it('empty genres array applies no genre filter', () => {
    const r = searchGigs(gigs, USER, criteria({ genres: [] }));
    expect(r).toHaveLength(3);
  });
});

// ─── Pay range (inclusive) ───────────────────────────────────────────────────

describe('searchGigs — pay range', () => {
  const gigs = [
    makeGig({ id: 'low', pay: 100 }),
    makeGig({ id: 'mid', pay: 250 }),
    makeGig({ id: 'high', pay: 500 }),
  ];

  it('minPay excludes below and includes the boundary', () => {
    const r = searchGigs(gigs, USER, criteria({ minPay: 250 }));
    expect(r.map((x) => x.gig.id).sort()).toEqual(['high', 'mid']);
  });

  it('maxPay excludes above and includes the boundary', () => {
    const r = searchGigs(gigs, USER, criteria({ maxPay: 250 }));
    expect(r.map((x) => x.gig.id).sort()).toEqual(['low', 'mid']);
  });

  it('both bounds form an inclusive band', () => {
    const r = searchGigs(gigs, USER, criteria({ minPay: 100, maxPay: 250 }));
    expect(r.map((x) => x.gig.id).sort()).toEqual(['low', 'mid']);
  });

  it('min === max returns exact-pay gigs', () => {
    const r = searchGigs(gigs, USER, criteria({ minPay: 250, maxPay: 250 }));
    expect(r.map((x) => x.gig.id)).toEqual(['mid']);
  });
});

// ─── Distance / radius ─────────────────────────────────────────────────────────

describe('searchGigs — distance / radius', () => {
  // near ≈ 0 miles, far ≈ 69 miles (1 degree lat ≈ 69 miles).
  const near = makeGig({ id: 'near', latitude: 36.1627, longitude: -86.7816 });
  const far = makeGig({ id: 'far', latitude: 37.1627, longitude: -86.7816 });
  const noLoc = makeGig({ id: 'noloc', latitude: 0, longitude: 0 });

  it('includes gigs within the radius (inclusive) and excludes beyond', () => {
    const r = searchGigs([near, far], USER, criteria({ maxDistanceMiles: 10 }));
    expect(r.map((x) => x.gig.id)).toEqual(['near']);
  });

  it('excludes invalid/zero coords when a radius is set', () => {
    const r = searchGigs([near, noLoc], USER, criteria({ maxDistanceMiles: 10 }));
    expect(r.map((x) => x.gig.id)).toEqual(['near']);
  });

  it('retains invalid/zero coords with distanceMiles null when no radius set', () => {
    const r = searchGigs([noLoc], USER, criteria({}));
    expect(r).toHaveLength(1);
    expect(r[0].distanceMiles).toBeNull();
  });

  it('computes a real per-gig distance for valid coords', () => {
    const r = searchGigs([near], USER, criteria({}));
    expect(r[0].distanceMiles).toBeCloseTo(0, 1);
  });
});

// ─── Sorting (all four modes) ────────────────────────────────────────────────

describe('searchGigs — sorting', () => {
  const gigs = [
    makeGig({ id: 'a', pay: 300, date: '2099-03-01', latitude: 37.1627, longitude: -86.7816 }),
    makeGig({ id: 'b', pay: 100, date: '2099-01-01', latitude: 36.1627, longitude: -86.7816 }),
    makeGig({ id: 'c', pay: 500, date: '2099-02-01', latitude: 36.5, longitude: -86.7816 }),
  ];

  it('distance: ascending with null-distance last', () => {
    const withNull = [...gigs, makeGig({ id: 'd', latitude: 0, longitude: 0 })];
    const r = searchGigs(withNull, USER, criteria({ sortBy: 'distance' }));
    expect(r.map((x) => x.gig.id)).toEqual(['b', 'c', 'a', 'd']);
    expect(r[r.length - 1].distanceMiles).toBeNull();
  });

  it('payHighToLow: non-increasing pay', () => {
    const r = searchGigs(gigs, USER, criteria({ sortBy: 'payHighToLow' }));
    expect(r.map((x) => x.gig.pay)).toEqual([500, 300, 100]);
  });

  it('payLowToHigh: non-decreasing pay', () => {
    const r = searchGigs(gigs, USER, criteria({ sortBy: 'payLowToHigh' }));
    expect(r.map((x) => x.gig.pay)).toEqual([100, 300, 500]);
  });

  it('dateSoonest: non-decreasing ISO date', () => {
    const r = searchGigs(gigs, USER, criteria({ sortBy: 'dateSoonest' }));
    expect(r.map((x) => x.gig.date)).toEqual(['2099-01-01', '2099-02-01', '2099-03-01']);
  });
});

// ─── sortResults directly ─────────────────────────────────────────────────────

describe('sortResults', () => {
  const items: GigWithDistance[] = [
    { gig: makeGig({ id: 'a', pay: 100 }), distanceMiles: 5 },
    { gig: makeGig({ id: 'b', pay: 200 }), distanceMiles: null },
    { gig: makeGig({ id: 'c', pay: 300 }), distanceMiles: 2 },
  ];

  it('does not mutate the input array', () => {
    const snapshot = items.map((x) => x.gig.id);
    sortResults(items, 'payHighToLow');
    expect(items.map((x) => x.gig.id)).toEqual(snapshot);
  });
});

// ─── Immutability & composition ──────────────────────────────────────────────

describe('searchGigs — immutability & composition', () => {
  it('does not mutate the input gigs array', () => {
    const gigs = [makeGig({ id: 'a', pay: 100 }), makeGig({ id: 'b', pay: 200 })];
    const snapshot = gigs.map((g) => g.id);
    searchGigs(gigs, USER, criteria({ sortBy: 'payHighToLow' }));
    expect(gigs.map((g) => g.id)).toEqual(snapshot);
    expect(gigs).toHaveLength(2);
  });

  it('tolerates a deeply frozen input (no mutation attempted)', () => {
    const gigs = [Object.freeze(makeGig({ id: 'a' }))] as Gig[];
    expect(() => searchGigs(gigs, USER, criteria({ query: 'rock' }))).not.toThrow();
  });

  it('combines text + genre + pay + radius + sort as an intersection', () => {
    const gigs = [
      makeGig({ id: 'keep', title: 'Rock Night', genres: ['rock'], pay: 250, latitude: 36.1627, longitude: -86.7816 }),
      makeGig({ id: 'wrongGenre', title: 'Rock Night', genres: ['jazz'], pay: 250 }),
      makeGig({ id: 'wrongPay', title: 'Rock Night', genres: ['rock'], pay: 10 }),
      makeGig({ id: 'tooFar', title: 'Rock Night', genres: ['rock'], pay: 250, latitude: 40.0, longitude: -86.7816 }),
      makeGig({ id: 'noText', title: 'Jazz', genres: ['rock'], pay: 250 }),
    ];
    const r = searchGigs(
      gigs,
      USER,
      criteria({ query: 'rock', genres: ['rock'], minPay: 100, maxPay: 400, maxDistanceMiles: 10 })
    );
    expect(r.map((x) => x.gig.id)).toEqual(['keep']);
  });
});

// ─── Edge cases ────────────────────────────────────────────────────────────────

describe('searchGigs — edge cases', () => {
  it('empty gigs input returns []', () => {
    expect(searchGigs([], USER, criteria({}))).toEqual([]);
  });

  it('criteria matching nothing returns []', () => {
    const gigs = [makeGig({ id: 'a' })];
    expect(searchGigs(gigs, USER, criteria({ query: 'no-such-thing' }))).toEqual([]);
  });

  it('all gigs invalid coords + radius set returns []', () => {
    const gigs = [
      makeGig({ id: 'a', latitude: 0, longitude: 0 }),
      makeGig({ id: 'b', latitude: 0, longitude: 0 }),
    ];
    expect(searchGigs(gigs, USER, criteria({ maxDistanceMiles: 25 }))).toEqual([]);
  });

  it('DEFAULT_SEARCH_CRITERIA returns every gig (distance-sorted)', () => {
    const gigs = [
      makeGig({ id: 'far', latitude: 37.1627, longitude: -86.7816 }),
      makeGig({ id: 'near', latitude: 36.1627, longitude: -86.7816 }),
    ];
    const r = searchGigs(gigs, USER, DEFAULT_SEARCH_CRITERIA);
    expect(r).toHaveLength(2);
    expect(r.map((x) => x.gig.id)).toEqual(['near', 'far']);
  });
});
