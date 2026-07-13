/**
 * Property-based test for coordinate validation.
 *
 * Feature: address-granularity-map-pin
 * Property 4: Coordinate validity determines map visibility
 *
 * Validates: Requirements 4.6
 */

import { isValidCoordinate } from '@/data/gigService';
import fc from 'fast-check';

describe('Feature: address-granularity-map-pin, Property 4: Coordinate validity determines map visibility', () => {
  it('returns true iff lat in [-90,90] AND lng in [-180,180] AND neither is zero', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (lat, lng) => {
          const result = isValidCoordinate(lat, lng);
          const expected =
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180 &&
            lat !== 0 &&
            lng !== 0;

          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when latitude is exactly zero', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
        (lng) => {
          expect(isValidCoordinate(0, lng)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when longitude is exactly zero', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
        (lat) => {
          expect(isValidCoordinate(lat, 0)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns true for valid boundary coordinates', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(-90, 90),
        fc.constantFrom(-180, 180),
        (lat, lng) => {
          expect(isValidCoordinate(lat, lng)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when latitude is outside [-90, 90]', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ min: -1000, max: -90.0001, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 90.0001, max: 1000, noNaN: true, noDefaultInfinity: true })
        ),
        fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
        (lat, lng) => {
          expect(isValidCoordinate(lat, lng)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when longitude is outside [-180, 180]', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
        fc.oneof(
          fc.double({ min: -1000, max: -180.0001, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 180.0001, max: 1000, noNaN: true, noDefaultInfinity: true })
        ),
        (lat, lng) => {
          expect(isValidCoordinate(lat, lng)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
