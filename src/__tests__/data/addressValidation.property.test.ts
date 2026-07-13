/**
 * Property-based tests for address validation in validateGigInput.
 *
 * Feature: address-granularity-map-pin
 */

import { validateGigInput } from '@/data/gigService';
import type { CreateGigInput } from '@/types';
import fc from 'fast-check';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/** The 4 required address fields */
const REQUIRED_ADDRESS_FIELDS = ['addressLine1', 'city', 'postcode', 'country'] as const;
type RequiredAddressField = (typeof REQUIRED_ADDRESS_FIELDS)[number];

// ─── Property 2: Required address field validation ───────────────────────────
// Feature: address-granularity-map-pin, Property 2: Required address field validation

describe('Feature: address-granularity-map-pin, Property 2: Required address field validation', () => {
  /**
   * **Validates: Requirements 2.4, 5.4**
   *
   * For any CreateGigInput where one or more required address fields
   * (addressLine1, city, postcode, country) are empty or whitespace-only,
   * the validation service SHALL return a validation error for exactly
   * those empty required fields and no others (among the address fields).
   */
  it('returns validation errors for exactly the required address fields that are empty/whitespace', () => {
    // Arbitrary for generating whitespace-only or empty strings
    const whitespaceArb = fc.oneof(
      fc.constant(''),
      fc.constant(' '),
      fc.constant('  '),
      fc.constant('\t'),
      fc.constant('   \t  '),
      fc.constant('\t  \t')
    );

    // Generate a boolean mask (at least one true) to select which fields to invalidate
    const subsetArb = fc
      .tuple(fc.boolean(), fc.boolean(), fc.boolean(), fc.boolean())
      .filter((mask) => mask.some(Boolean));

    fc.assert(
      fc.property(
        subsetArb,
        fc.tuple(whitespaceArb, whitespaceArb, whitespaceArb, whitespaceArb),
        (mask, whitespaceValues) => {
          const input = { ...validBaseInput() };

          // Determine which fields are invalidated based on the mask
          const fieldsToInvalidate: RequiredAddressField[] = [];
          REQUIRED_ADDRESS_FIELDS.forEach((field, index) => {
            if (mask[index]) {
              fieldsToInvalidate.push(field);
              (input as Record<string, unknown>)[field] = whitespaceValues[index];
            }
          });

          const result = validateGigInput(input);

          // Must return a validation error
          expect(result).not.toBeNull();
          expect(result!.type).toBe('validation');

          // The invalidated fields must all have errors
          for (const field of fieldsToInvalidate) {
            expect(result!.fields[field]).toBe('This field is required');
          }

          // The required address fields NOT in the invalid set must NOT have errors
          const validAddressFields = REQUIRED_ADDRESS_FIELDS.filter(
            (f) => !fieldsToInvalidate.includes(f)
          );
          for (const field of validAddressFields) {
            expect(result!.fields[field]).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
