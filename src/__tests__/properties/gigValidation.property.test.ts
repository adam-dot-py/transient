/**
 * Property-based tests for extended gig validation.
 *
 * Properties tested:
 * - Property 10: Multi-genre requirement (gig creation requires ≥1 valid genre)
 * - Property 9: Example songs count invariant (max 10 songs)
 */

import { validateExampleSongs, validateGigInput } from '@/data/gigService';
import type { CreateGigInput, Genre } from '@/types';
import fc from 'fast-check';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_GENRES: Genre[] = [
  'rock', 'jazz', 'blues', 'electronic', 'folk', 'classical', 'pop', 'country',
];

/** Returns a future date string in YYYY-MM-DD format */
function futureDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

/** A valid CreateGigInput with all required fields properly filled */
function validBaseInput(): CreateGigInput {
  return {
    title: 'Test Gig',
    venueName: 'Test Venue',
    addressLine1: '123 Test Street',
    city: 'Nashville',
    postcode: '37201',
    country: 'USA',
    date: futureDate(),
    startTime: '19:00',
    endTime: '22:00',
    genres: ['rock'],
    pay: 250,
  };
}

// ─── Property 10: Gig Creation Multi-Genre Validation ────────────────────────

describe('Property 10: Gig Creation Multi-Genre Validation', () => {
  /**
   * **Validates: Requirements 3.2**
   *
   * Gig creation requires at least one genre from the valid genre list.
   * Validation passes (no genre error) iff genres array is non-empty and
   * all elements are valid.
   */
  it('validation passes for genres iff array is non-empty and all elements are valid', () => {
    // Generate a non-empty subarray of valid genres
    const validGenresArb = fc
      .subarray(VALID_GENRES, { minLength: 1, maxLength: VALID_GENRES.length });

    fc.assert(
      fc.property(validGenresArb, (genres) => {
        const input: CreateGigInput = { ...validBaseInput(), genres };
        const result = validateGigInput(input);

        // With valid genres and all other fields valid, no genre error should exist
        if (result === null) {
          // Entire validation passed — genres are fine
          return true;
        }
        // If there's an error, it should NOT be about genres
        expect(result.fields.genres).toBeUndefined();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('validation fails with genre error when genres array is empty', () => {
    fc.assert(
      fc.property(fc.constant([]), (genres) => {
        const input = { ...validBaseInput(), genres: genres as Genre[] };
        const result = validateGigInput(input);

        expect(result).not.toBeNull();
        expect(result!.fields.genres).toBe('At least one genre is required');
      }),
      { numRuns: 1 }
    );
  });

  it('validation fails with genre error when genres contain invalid values', () => {
    // Generate strings that are NOT valid genres
    const invalidGenreArb = fc
      .string({ minLength: 1, maxLength: 20 })
      .filter((s) => !VALID_GENRES.includes(s as Genre));

    fc.assert(
      fc.property(
        fc.array(invalidGenreArb, { minLength: 1, maxLength: 5 }),
        (invalidGenres) => {
          const input = { ...validBaseInput(), genres: invalidGenres as Genre[] };
          const result = validateGigInput(input);

          expect(result).not.toBeNull();
          expect(result!.fields.genres).toBe('Invalid genre selected');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validation fails when genres array mixes valid and invalid values', () => {
    const invalidGenreArb = fc
      .string({ minLength: 1, maxLength: 20 })
      .filter((s) => !VALID_GENRES.includes(s as Genre));

    // At least one valid genre combined with at least one invalid genre
    const mixedGenresArb = fc.tuple(
      fc.subarray(VALID_GENRES, { minLength: 1, maxLength: 3 }),
      fc.array(invalidGenreArb, { minLength: 1, maxLength: 3 })
    ).map(([valid, invalid]) => [...valid, ...invalid]);

    fc.assert(
      fc.property(mixedGenresArb, (genres) => {
        const input = { ...validBaseInput(), genres: genres as Genre[] };
        const result = validateGigInput(input);

        expect(result).not.toBeNull();
        expect(result!.fields.genres).toBe('Invalid genre selected');
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 9: Example Songs Count Invariant ───────────────────────────────

describe('Property 9: Example Songs Count Invariant', () => {
  /**
   * **Validates: Requirements 3.5**
   *
   * A gig has at most 10 example songs. validateExampleSongs passes for
   * arrays of length ≤10 (with valid entries) and fails for arrays of
   * length >10.
   */

  /** Arbitrary for a valid song with non-empty, non-whitespace title and artist */
  const validSongArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    artist: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  });

  it('passes validation for ≤10 valid songs', () => {
    const songsArb = fc.array(validSongArb, { minLength: 0, maxLength: 10 });

    fc.assert(
      fc.property(songsArb, (songs) => {
        const result = validateExampleSongs(songs);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('fails validation for >10 songs', () => {
    const songsArb = fc.array(validSongArb, { minLength: 11, maxLength: 15 });

    fc.assert(
      fc.property(songsArb, (songs) => {
        const result = validateExampleSongs(songs);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Maximum of 10 example songs allowed');
      }),
      { numRuns: 100 }
    );
  });

  it('the boundary at exactly 10 songs passes and 11 fails', () => {
    // Generate exactly 10 songs — should pass
    const tenSongsArb = fc.array(validSongArb, { minLength: 10, maxLength: 10 });

    fc.assert(
      fc.property(tenSongsArb, (songs) => {
        expect(songs.length).toBe(10);
        const result = validateExampleSongs(songs);
        expect(result.isValid).toBe(true);
      }),
      { numRuns: 50 }
    );

    // Generate exactly 11 songs — should fail
    const elevenSongsArb = fc.array(validSongArb, { minLength: 11, maxLength: 11 });

    fc.assert(
      fc.property(elevenSongsArb, (songs) => {
        expect(songs.length).toBe(11);
        const result = validateExampleSongs(songs);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Maximum of 10 example songs allowed');
      }),
      { numRuns: 50 }
    );
  });
});
