/**
 * Property-based test for formatStructuredAddress.
 *
 * Feature: address-granularity-map-pin, Property 3: Address formatting with optional field omission
 *
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import { formatStructuredAddress } from '@/data/gigService';
import fc from 'fast-check';

/**
 * Arbitrary that produces a non-empty string without commas (valid address field content).
 * We exclude commas because the separator is ", " and field values containing commas
 * would make order assertions ambiguous.
 */
const nonEmptyField = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length > 0 && !s.includes(','));

/**
 * Arbitrary for a field that may be present (non-empty string) or absent (empty/undefined).
 */
const optionalField = fc.oneof(nonEmptyField, fc.constant(''), fc.constant(undefined));

/**
 * Arbitrary for a field that may be present or empty (simulating required fields
 * that could still be empty to exercise the omission logic).
 */
const maybeField = fc.oneof(nonEmptyField, fc.constant(''));

describe('Feature: address-granularity-map-pin, Property 3: Address formatting with optional field omission', () => {
  it('output has no consecutive separators (no ", ,")', () => {
    fc.assert(
      fc.property(
        maybeField,
        optionalField,
        maybeField,
        maybeField,
        maybeField,
        (addressLine1, addressLine2, city, postcode, country) => {
          const result = formatStructuredAddress({
            addressLine1,
            addressLine2: addressLine2 === undefined ? undefined : addressLine2,
            city,
            postcode,
            country,
          });
          expect(result).not.toContain(', ,');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('output does not start with a separator', () => {
    fc.assert(
      fc.property(
        maybeField,
        optionalField,
        maybeField,
        maybeField,
        maybeField,
        (addressLine1, addressLine2, city, postcode, country) => {
          const result = formatStructuredAddress({
            addressLine1,
            addressLine2: addressLine2 === undefined ? undefined : addressLine2,
            city,
            postcode,
            country,
          });
          expect(result).not.toMatch(/^,/);
          expect(result).not.toMatch(/^\s*,/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('output does not end with a separator', () => {
    fc.assert(
      fc.property(
        maybeField,
        optionalField,
        maybeField,
        maybeField,
        maybeField,
        (addressLine1, addressLine2, city, postcode, country) => {
          const result = formatStructuredAddress({
            addressLine1,
            addressLine2: addressLine2 === undefined ? undefined : addressLine2,
            city,
            postcode,
            country,
          });
          expect(result).not.toMatch(/,\s*$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('non-empty fields appear in the correct order (addressLine1, addressLine2, city, postcode, country)', () => {
    fc.assert(
      fc.property(
        maybeField,
        optionalField,
        maybeField,
        maybeField,
        maybeField,
        (addressLine1, addressLine2, city, postcode, country) => {
          const result = formatStructuredAddress({
            addressLine1,
            addressLine2: addressLine2 === undefined ? undefined : addressLine2,
            city,
            postcode,
            country,
          });

          // Build expected non-empty fields in order
          const fields = [addressLine1, addressLine2, city, postcode, country];
          const nonEmptyFields = fields.filter(
            (f) => f !== undefined && f.trim().length > 0
          );

          if (nonEmptyFields.length === 0) {
            expect(result).toBe('');
          } else {
            // The expected output is exactly the non-empty fields joined by ", "
            const expected = nonEmptyFields.join(', ');
            expect(result).toBe(expected);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
