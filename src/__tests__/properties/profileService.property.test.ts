/**
 * Property-based tests for profileService validation.
 *
 * Properties tested:
 * - Property 3: Bio length constraint (≤500 chars)
 * - Property 2: Music link count invariant (max 10 links)
 * - Property 1: Profile validation completeness (displayName + genres)
 * - Property 11: Profile image validation (size ≤5MB, JPEG/PNG only)
 */

import {
    validateBio,
    validateMusicLinks,
    validateProfile,
    validateProfileImage,
} from '@/data/profileService';
import type { Genre, MusicLink } from '@/types';
import fc from 'fast-check';

// ─── Constants ───────────────────────────────────────────────────────────────

const VALID_GENRES: Genre[] = [
  'rock', 'jazz', 'blues', 'electronic', 'folk', 'classical', 'pop', 'country',
];

const MAX_BIO_LENGTH = 500;
const MAX_MUSIC_LINKS = 10;
const MAX_IMAGE_SIZE = 5_242_880; // 5MB in bytes
const VALID_MIME_TYPES = ['image/jpeg', 'image/png'];

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Arbitrary for a valid MusicLink */
const validMusicLinkArb: fc.Arbitrary<MusicLink> = fc.record({
  platform: fc.constantFrom('apple_music' as const, 'google_music' as const),
  url: fc.webUrl({ validSchemes: ['https'] }),
  title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
});

// ─── Property 3: Bio Length Constraint ───────────────────────────────────────

describe('Property 3: Bio Length Constraint', () => {
  /**
   * **Validates: Requirements 2.2**
   *
   * For any string input as bio, validation passes if and only if the
   * string length is ≤ 500 characters.
   */
  it('validateBio passes iff bio.length ≤ 500', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 1000 }), (bio) => {
        const result = validateBio(bio);

        if (bio.length <= MAX_BIO_LENGTH) {
          expect(result.isValid).toBe(true);
          expect(result.error).toBeUndefined();
        } else {
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
        }
      }),
      { numRuns: 200 }
    );
  });

  it('passes at the exact boundary of 500 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: MAX_BIO_LENGTH, maxLength: MAX_BIO_LENGTH }),
        (bio) => {
          expect(bio.length).toBe(MAX_BIO_LENGTH);
          const result = validateBio(bio);
          expect(result.isValid).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('fails at exactly 501 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: MAX_BIO_LENGTH + 1, maxLength: MAX_BIO_LENGTH + 1 }),
        (bio) => {
          expect(bio.length).toBe(MAX_BIO_LENGTH + 1);
          const result = validateBio(bio);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Bio must be 500 characters or less');
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ─── Property 2: Music Link Count Invariant ──────────────────────────────────

describe('Property 2: Music Link Count Invariant', () => {
  /**
   * **Validates: Requirements 2.5**
   *
   * For any musician profile, the music_links array has at most 10 entries.
   * validateMusicLinks fails when links.length > 10.
   */
  it('validateMusicLinks fails when links.length > 10', () => {
    const tooManyLinksArb = fc.array(validMusicLinkArb, {
      minLength: MAX_MUSIC_LINKS + 1,
      maxLength: MAX_MUSIC_LINKS + 5,
    });

    fc.assert(
      fc.property(tooManyLinksArb, (links) => {
        const result = validateMusicLinks(links);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Maximum of 10 music links allowed');
      }),
      { numRuns: 100 }
    );
  });

  it('validateMusicLinks passes for ≤10 valid links', () => {
    const validLinksArb = fc.array(validMusicLinkArb, {
      minLength: 0,
      maxLength: MAX_MUSIC_LINKS,
    });

    fc.assert(
      fc.property(validLinksArb, (links) => {
        const result = validateMusicLinks(links);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('the boundary at exactly 10 links passes and 11 fails', () => {
    const tenLinksArb = fc.array(validMusicLinkArb, {
      minLength: MAX_MUSIC_LINKS,
      maxLength: MAX_MUSIC_LINKS,
    });

    fc.assert(
      fc.property(tenLinksArb, (links) => {
        expect(links.length).toBe(MAX_MUSIC_LINKS);
        const result = validateMusicLinks(links);
        expect(result.isValid).toBe(true);
      }),
      { numRuns: 50 }
    );

    const elevenLinksArb = fc.array(validMusicLinkArb, {
      minLength: MAX_MUSIC_LINKS + 1,
      maxLength: MAX_MUSIC_LINKS + 1,
    });

    fc.assert(
      fc.property(elevenLinksArb, (links) => {
        expect(links.length).toBe(MAX_MUSIC_LINKS + 1);
        const result = validateMusicLinks(links);
        expect(result.isValid).toBe(false);
      }),
      { numRuns: 50 }
    );
  });
});

// ─── Property 1: Profile Validation Completeness ─────────────────────────────

describe('Property 1: Profile Validation Completeness', () => {
  /**
   * **Validates: Requirements 2.6, 2.7**
   *
   * For any musician profile input, validateProfile returns success if and
   * only if displayName is non-empty AND genres contains at least one valid
   * genre from the predefined list.
   */
  it('validateProfile passes iff displayName is non-empty AND genres has ≥1 valid genre', () => {
    // Generate display names (possibly empty/whitespace)
    const displayNameArb = fc.oneof(
      fc.string({ minLength: 0, maxLength: 50 }),
      fc.constant(''),
      fc.constant('  '),
      fc.constant('\t'),
    );

    // Generate genre arrays: mix of valid, invalid, and empty
    const genreArrayArb = fc.oneof(
      fc.constant([] as Genre[]),
      fc.subarray(VALID_GENRES, { minLength: 1, maxLength: VALID_GENRES.length }),
      fc.array(
        fc.string({ minLength: 1, maxLength: 20 }).filter(
          (s) => !VALID_GENRES.includes(s as Genre)
        ) as fc.Arbitrary<Genre>,
        { minLength: 1, maxLength: 3 }
      ),
    );

    fc.assert(
      fc.property(displayNameArb, genreArrayArb, (displayName, genres) => {
        const result = validateProfile({ displayName, genres });

        const hasValidDisplayName = displayName.trim().length > 0;
        const hasAtLeastOneValidGenre =
          genres.length >= 1 && genres.every((g) => VALID_GENRES.includes(g));

        const expectedValid = hasValidDisplayName && hasAtLeastOneValidGenre;

        expect(result.isValid).toBe(expectedValid);

        if (!hasValidDisplayName) {
          expect(result.errors.displayName).toBeDefined();
        } else {
          expect(result.errors.displayName).toBeUndefined();
        }

        if (!hasAtLeastOneValidGenre) {
          expect(result.errors.genres).toBeDefined();
        } else {
          expect(result.errors.genres).toBeUndefined();
        }
      }),
      { numRuns: 200 }
    );
  });

  it('passes with valid display name and at least one valid genre', () => {
    const validNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(
      (s) => s.trim().length > 0
    );
    const validGenresArb = fc.subarray(VALID_GENRES, {
      minLength: 1,
      maxLength: VALID_GENRES.length,
    });

    fc.assert(
      fc.property(validNameArb, validGenresArb, (displayName, genres) => {
        const result = validateProfile({ displayName, genres });
        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('fails with empty display name', () => {
    const emptyNameArb = fc.oneof(
      fc.constant(''),
      fc.constant('  '),
      fc.constant('\t'),
      fc.constant('   \t   '),
    );

    fc.assert(
      fc.property(emptyNameArb, (displayName) => {
        const result = validateProfile({ displayName, genres: ['rock'] });
        expect(result.isValid).toBe(false);
        expect(result.errors.displayName).toBe('Display name is required');
      }),
      { numRuns: 10 }
    );
  });

  it('fails with empty genres array', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
        (displayName) => {
          const result = validateProfile({ displayName, genres: [] });
          expect(result.isValid).toBe(false);
          expect(result.errors.genres).toBe('At least one genre is required');
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ─── Property 11: Profile Image Validation ───────────────────────────────────

describe('Property 11: Profile Image Validation', () => {
  /**
   * **Validates: Requirements 2.1**
   *
   * A profile image upload passes validation if and only if the file size is
   * ≤ 5MB (5,242,880 bytes) and the MIME type is 'image/jpeg' or 'image/png'.
   */
  it('validateProfileImage passes iff size ≤ 5,242,880 AND mimeType is jpeg or png', () => {
    // Size arbitrary: 0 to 10MB range for testing both sides of the boundary
    const sizeArb = fc.integer({ min: 0, max: 10_485_760 });

    // MIME type arbitrary: mix of valid and invalid types
    const mimeTypeArb = fc.oneof(
      fc.constant('image/jpeg'),
      fc.constant('image/png'),
      fc.constant('image/gif'),
      fc.constant('image/webp'),
      fc.constant('application/pdf'),
      fc.constant('text/plain'),
    );

    fc.assert(
      fc.property(sizeArb, mimeTypeArb, (size, mimeType) => {
        const result = validateProfileImage({ size, mimeType });

        const sizeValid = size <= MAX_IMAGE_SIZE;
        const mimeValid = VALID_MIME_TYPES.includes(mimeType);
        const expectedValid = sizeValid && mimeValid;

        expect(result.isValid).toBe(expectedValid);

        if (!expectedValid) {
          expect(result.error).toBeDefined();
        } else {
          expect(result.error).toBeUndefined();
        }
      }),
      { numRuns: 200 }
    );
  });

  it('passes at exactly 5MB with valid MIME type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('image/jpeg', 'image/png'),
        (mimeType) => {
          const result = validateProfileImage({ size: MAX_IMAGE_SIZE, mimeType });
          expect(result.isValid).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('fails at 5MB + 1 byte with valid MIME type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('image/jpeg', 'image/png'),
        (mimeType) => {
          const result = validateProfileImage({ size: MAX_IMAGE_SIZE + 1, mimeType });
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Image must be 5MB or less');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('fails with invalid MIME type regardless of size', () => {
    const invalidMimeArb = fc.constantFrom(
      'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'video/mp4'
    );
    const validSizeArb = fc.integer({ min: 0, max: MAX_IMAGE_SIZE });

    fc.assert(
      fc.property(validSizeArb, invalidMimeArb, (size, mimeType) => {
        const result = validateProfileImage({ size, mimeType });
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Only JPEG and PNG images are allowed');
      }),
      { numRuns: 100 }
    );
  });
});
