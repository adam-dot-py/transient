/**
 * Tests for amplifyService.getPushRecipients — the pure Amplify recipient
 * matcher (Jest + fast-check).
 *
 * Example-based tests pin the concrete behaviour (radius, genre overlap, hoster
 * exclusion, no-location exclusion, sort order). Property-based tests assert the
 * invariants that must hold for ANY gig / musician set:
 *   - every recipient is within the radius, is not the hoster, has a location;
 *   - distances are non-negative and sorted ascending;
 *   - result is a subset of the input (no invented ids, no duplicates);
 *   - widening the radius never drops a previously-matched recipient (monotone).
 */

import { getPushRecipients, type PushCandidate } from '@/data/amplifyService';
import { getDistanceMiles } from '@/data/searchService';
import type { Genre, Gig } from '@/types';
import fc from 'fast-check';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ALL_GENRES: Genre[] = [
  'rock', 'jazz', 'blues', 'electronic', 'folk', 'classical', 'pop', 'country',
];

/** A London-centred gig (matches the London/Bristol mock musicians by proximity). */
function makeGig(overrides: Partial<Gig> = {}): Gig {
  return {
    id: 'gig-london',
    title: 'Soho Jazz Night',
    venueName: 'Ronnie Scott’s',
    addressLine1: '47 Frith St',
    addressLine2: '',
    city: 'London',
    postcode: 'W1D 4HT',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    date: '2099-01-01',
    startTime: '20:00',
    endTime: '23:00',
    genres: ['jazz', 'blues'],
    pay: 200,
    description: '',
    status: 'available',
    hosterId: 'hoster-1',
    acceptedMusicianIds: [],
    ...overrides,
  };
}

const LONDON: Pick<PushCandidate, 'latitude' | 'longitude'> = {
  latitude: 51.5074, longitude: -0.1278,
};
const BRISTOL: Pick<PushCandidate, 'latitude' | 'longitude'> = {
  latitude: 51.4545, longitude: -2.5879, // ~106 mi from London
};
const MANCHESTER: Pick<PushCandidate, 'latitude' | 'longitude'> = {
  latitude: 53.4808, longitude: -2.2426, // ~163 mi from London
};

// ─── Example-based ───────────────────────────────────────────────────────────

describe('getPushRecipients — concrete behaviour', () => {
  it('returns a nearby, genre-matching musician', () => {
    const musicians: PushCandidate[] = [
      { id: 'm-london-jazz', genres: ['jazz'], ...LONDON },
    ];
    const out = getPushRecipients(makeGig(), musicians, { radiusMiles: 10 });
    expect(out).toHaveLength(1);
    expect(out[0].musicianId).toBe('m-london-jazz');
    expect(out[0].distanceMiles).toBeCloseTo(0, 1);
  });

  it('excludes a musician outside the radius', () => {
    const musicians: PushCandidate[] = [
      { id: 'm-bristol', genres: ['jazz'], ...BRISTOL },
    ];
    // Bristol is ~106 mi away: inside 25mi? no.
    expect(getPushRecipients(makeGig(), musicians, { radiusMiles: 25 })).toHaveLength(0);
    // A huge radius includes it.
    expect(getPushRecipients(makeGig(), musicians, { radiusMiles: 200 })).toHaveLength(1);
  });

  it('excludes a musician who shares no genre when genre matching is on', () => {
    const musicians: PushCandidate[] = [
      { id: 'm-london-rock', genres: ['rock', 'pop'], ...LONDON },
    ];
    const gig = makeGig({ genres: ['jazz', 'blues'] });
    expect(getPushRecipients(gig, musicians, { radiusMiles: 10 })).toHaveLength(0);
    // ...but is included when genre matching is disabled.
    expect(
      getPushRecipients(gig, musicians, { radiusMiles: 10, matchGenres: false })
    ).toHaveLength(1);
  });

  it('never pushes a gig back to its own hoster', () => {
    const musicians: PushCandidate[] = [
      { id: 'hoster-1', genres: ['jazz'], ...LONDON }, // same id as gig.hosterId
    ];
    expect(getPushRecipients(makeGig(), musicians, { radiusMiles: 10 })).toHaveLength(0);
  });

  it('excludes musicians with no / zero / out-of-range coordinates', () => {
    const musicians: PushCandidate[] = [
      { id: 'm-null', genres: ['jazz'], latitude: null, longitude: null },
      { id: 'm-undef', genres: ['jazz'] },
      { id: 'm-zero', genres: ['jazz'], latitude: 0, longitude: 0 },
      { id: 'm-oob', genres: ['jazz'], latitude: 999, longitude: 999 },
    ];
    expect(getPushRecipients(makeGig(), musicians, { radiusMiles: 100 })).toHaveLength(0);
  });

  it('returns nothing when the gig itself has no location', () => {
    const musicians: PushCandidate[] = [{ id: 'm1', genres: ['jazz'], ...LONDON }];
    const gig = makeGig({ latitude: 0, longitude: 0 });
    expect(getPushRecipients(gig, musicians, { radiusMiles: 100 })).toHaveLength(0);
  });

  it('sorts recipients nearest-first', () => {
    const musicians: PushCandidate[] = [
      { id: 'm-manchester', genres: ['jazz'], ...MANCHESTER },
      { id: 'm-london', genres: ['jazz'], ...LONDON },
      { id: 'm-bristol', genres: ['jazz'], ...BRISTOL },
    ];
    const out = getPushRecipients(makeGig(), musicians, { radiusMiles: 300 });
    expect(out.map((r) => r.musicianId)).toEqual([
      'm-london', 'm-bristol', 'm-manchester',
    ]);
    // Distances strictly non-decreasing.
    for (let i = 1; i < out.length; i++) {
      expect(out[i].distanceMiles).toBeGreaterThanOrEqual(out[i - 1].distanceMiles);
    }
  });

  it('does not mutate its inputs', () => {
    const musicians: PushCandidate[] = [{ id: 'm1', genres: ['jazz'], ...LONDON }];
    const snapshot = JSON.stringify(musicians);
    getPushRecipients(makeGig(), musicians, { radiusMiles: 10 });
    expect(JSON.stringify(musicians)).toBe(snapshot);
  });
});

// ─── Property-based ──────────────────────────────────────────────────────────

const latArb = fc.double({ min: -89, max: 89, noNaN: true, noDefaultInfinity: true });
const lngArb = fc.double({ min: -179, max: 179, noNaN: true, noDefaultInfinity: true });

const candidateArb: fc.Arbitrary<PushCandidate> = fc.record({
  id: fc.uuid(),
  genres: fc.subarray(ALL_GENRES, { minLength: 0 }),
  latitude: fc.oneof(latArb, fc.constant(0), fc.constant(null)),
  longitude: fc.oneof(lngArb, fc.constant(0), fc.constant(null)),
});

const gigArb: fc.Arbitrary<Gig> = fc
  .record({
    hosterId: fc.uuid(),
    latitude: latArb,
    longitude: lngArb,
    genres: fc.subarray(ALL_GENRES, { minLength: 1 }),
  })
  .map((r) => makeGig(r));

describe('getPushRecipients — invariants', () => {
  it('every recipient is within radius, not the hoster, with a valid location', () => {
    fc.assert(
      fc.property(
        gigArb,
        fc.array(candidateArb, { maxLength: 20 }),
        fc.constantFrom(5, 10, 15, 25, 100),
        fc.boolean(),
        (gig, musicians, radiusMiles, matchGenres) => {
          const out = getPushRecipients(gig, musicians, { radiusMiles, matchGenres });
          for (const r of out) {
            expect(r.musicianId).not.toBe(gig.hosterId);
            expect(r.distanceMiles).toBeGreaterThanOrEqual(0);
            expect(r.distanceMiles).toBeLessThanOrEqual(radiusMiles);
          }
        }
      )
    );
  });

  it('result ids are a duplicate-free subset of the input musicians', () => {
    fc.assert(
      fc.property(
        gigArb,
        fc.array(candidateArb, { maxLength: 20 }),
        fc.constantFrom(10, 50, 500),
        (gig, musicians, radiusMiles) => {
          const out = getPushRecipients(gig, musicians, { radiusMiles });
          const ids = out.map((r) => r.musicianId);
          // no duplicates
          expect(new Set(ids).size).toBe(ids.length);
          // subset of input ids
          const inputIds = new Set(musicians.map((m) => m.id));
          for (const id of ids) expect(inputIds.has(id)).toBe(true);
        }
      )
    );
  });

  it('is sorted by ascending distance', () => {
    fc.assert(
      fc.property(
        gigArb,
        fc.array(candidateArb, { maxLength: 20 }),
        fc.constantFrom(25, 100, 1000),
        (gig, musicians, radiusMiles) => {
          const out = getPushRecipients(gig, musicians, { radiusMiles });
          for (let i = 1; i < out.length; i++) {
            expect(out[i].distanceMiles).toBeGreaterThanOrEqual(out[i - 1].distanceMiles);
          }
        }
      )
    );
  });

  it('widening the radius never drops a previously-matched recipient (monotone)', () => {
    fc.assert(
      fc.property(
        gigArb,
        fc.array(candidateArb, { maxLength: 20 }),
        (gig, musicians) => {
          const small = new Set(
            getPushRecipients(gig, musicians, { radiusMiles: 25, matchGenres: false }).map(
              (r) => r.musicianId
            )
          );
          const large = new Set(
            getPushRecipients(gig, musicians, { radiusMiles: 500, matchGenres: false }).map(
              (r) => r.musicianId
            )
          );
          for (const id of small) expect(large.has(id)).toBe(true);
        }
      )
    );
  });

  it('reported distance matches the Haversine distance to the gig', () => {
    fc.assert(
      fc.property(gigArb, candidateArb, (gig, musician) => {
        const out = getPushRecipients(gig, [musician], { radiusMiles: 100000, matchGenres: false });
        if (out.length === 1) {
          const expected = getDistanceMiles(
            { latitude: gig.latitude, longitude: gig.longitude },
            { latitude: musician.latitude as number, longitude: musician.longitude as number }
          );
          expect(out[0].distanceMiles).toBeCloseTo(expected, 6);
        }
      })
    );
  });
});
