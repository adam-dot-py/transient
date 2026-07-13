/**
 * Property-based tests for notificationService genre matching logic.
 *
 * **Validates: Requirements 4.2**
 *
 * Property 8 from design doc:
 * A musician receives a push notification for a new gig if and only if
 * at least one of the musician's genres overlaps with the gig's required genres.
 *
 * ∀ musician, gig →
 *   shouldNotify(musician, gig) ↔ musician.genres ∩ gig.genres ≠ ∅
 */

import { matchMusiciansForGig, shouldNotifyMusician } from '@/data/notificationService';
import type { Genre } from '@/types';
import fc from 'fast-check';

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Arbitrary for generating a non-empty subset of genres */
const nonEmptyGenresArb = fc.subarray(ALL_GENRES, { minLength: 1 });

/** Arbitrary for generating any subset of genres (including empty) */
const genresArb = fc.subarray(ALL_GENRES);

/** Arbitrary for generating a musician with id and genres */
const musicianArb = fc.record({
  id: fc.uuid(),
  genres: genresArb,
});

/** Checks whether two genre arrays have any overlap */
function hasOverlap(a: Genre[], b: Genre[]): boolean {
  return a.some((genre) => b.includes(genre));
}

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Property 8: Push Notification Genre Matching', () => {
  /**
   * **Validates: Requirements 4.2**
   *
   * shouldNotifyMusician returns true if and only if there is genre overlap
   * between the musician's genres and the gig's genres.
   */
  it('shouldNotifyMusician returns true iff there is genre overlap', () => {
    fc.assert(
      fc.property(genresArb, genresArb, (musicianGenres, gigGenres) => {
        const result = shouldNotifyMusician(musicianGenres, gigGenres);
        const expectedOverlap = hasOverlap(musicianGenres, gigGenres);

        expect(result).toBe(expectedOverlap);
      }),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 4.2**
   *
   * matchMusiciansForGig returns exactly those musician IDs whose genres
   * overlap with the gig's genres.
   */
  it('matchMusiciansForGig returns exactly those musicians with genre overlap', () => {
    fc.assert(
      fc.property(
        fc.array(musicianArb, { minLength: 0, maxLength: 20 }),
        genresArb,
        (musicians, gigGenres) => {
          const result = matchMusiciansForGig(musicians, gigGenres);

          // Manually compute expected IDs
          const expected = musicians
            .filter((m) => shouldNotifyMusician(m.genres, gigGenres))
            .map((m) => m.id);

          expect(result).toEqual(expected);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * **Validates: Requirements 4.2**
   *
   * Empty genres always returns false — if either the musician has no genres
   * or the gig has no genres, shouldNotifyMusician returns false.
   */
  it('shouldNotifyMusician returns false when either genre array is empty', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Case 1: musician genres empty, gig genres arbitrary
          fc.tuple(fc.constant([] as Genre[]), genresArb),
          // Case 2: musician genres arbitrary, gig genres empty
          fc.tuple(genresArb, fc.constant([] as Genre[])),
          // Case 3: both empty
          fc.tuple(fc.constant([] as Genre[]), fc.constant([] as Genre[]))
        ),
        ([musicianGenres, gigGenres]) => {
          const result = shouldNotifyMusician(musicianGenres, gigGenres);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});
