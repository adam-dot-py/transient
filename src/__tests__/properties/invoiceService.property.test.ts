/**
 * Property-based tests for invoiceService.
 *
 * Properties tested:
 * - Property 1: buildInvoice total always equals subtotal always equals
 *   payment.amountPence, for any valid payment.
 * - Property 2: generateInvoiceNumber is deterministic and always matches the
 *   INV-YYYYMMDD-<short> regex.
 * - Property 3: canGenerateInvoice is allowed IFF the musician is accepted AND a
 *   paid payment exists.
 * - Property 4: formatCurrencyPence and penceToPounds agree — the formatted
 *   string parses back to the pounds value within rounding.
 */

import {
  buildInvoice,
  canGenerateInvoice,
  formatCurrencyPence,
  generateInvoiceNumber,
  penceToPounds,
} from '@/data/invoiceService';
import type { ApplicationStatus, Gig, GigPayment, GigPaymentStatus, InvoiceParty } from '@/types';
import fc from 'fast-check';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const gigArb: fc.Arbitrary<Gig> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 60 }),
  venueName: fc.string({ minLength: 1, maxLength: 40 }),
  addressLine1: fc.string({ minLength: 1, maxLength: 40 }),
  addressLine2: fc.constant(''),
  city: fc.string({ minLength: 1, maxLength: 20 }),
  postcode: fc.string({ minLength: 1, maxLength: 10 }),
  country: fc.string({ minLength: 1, maxLength: 20 }),
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  date: fc.constant('2024-01-10'),
  startTime: fc.constant('21:00'),
  endTime: fc.constant('23:30'),
  genres: fc.constant(['rock'] as Gig['genres']),
  pay: fc.integer({ min: 1, max: 99999 }),
  description: fc.string({ maxLength: 100 }),
  status: fc.constant('past' as const),
  hosterId: fc.uuid(),
  acceptedMusicianIds: fc.constant([]),
});

const partyArb: fc.Arbitrary<InvoiceParty> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 40 }),
  addressLines: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
    minLength: 0,
    maxLength: 3,
  }),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
});

const paymentArb = (overrides?: {
  amountPence?: fc.Arbitrary<number>;
  status?: GigPaymentStatus;
  invoiceNumber?: string | null;
}): fc.Arbitrary<GigPayment> =>
  fc.record({
    id: fc.uuid(),
    gigId: fc.uuid(),
    musicianId: fc.uuid(),
    amountPence: overrides?.amountPence ?? fc.integer({ min: 1, max: 9999900 }),
    currency: fc.constant('gbp'),
    status: overrides?.status
      ? fc.constant(overrides.status)
      : fc.constantFrom('pending' as const, 'paid' as const),
    invoiceNumber:
      overrides?.invoiceNumber !== undefined
        ? fc.constant(overrides.invoiceNumber)
        : fc.constant(null),
    paidAt: fc.constant('2024-01-15T18:30:00.000Z'),
    createdAt: fc.constant('2024-01-15T18:00:00.000Z'),
  });

const applicationStatusArb: fc.Arbitrary<ApplicationStatus> = fc.constantFrom(
  'pending',
  'accepted',
  'declined'
);

// ─── Property 1: totals equal the payment amount ─────────────────────────────

describe('Property 1: buildInvoice totals equal payment amount', () => {
  it('subtotal === total === payment.amountPence for any valid payment', () => {
    fc.assert(
      fc.property(
        gigArb,
        partyArb,
        partyArb,
        paymentArb({ status: 'paid' }),
        (gig, musician, hoster, payment) => {
          const invoice = buildInvoice({ gig, musician, hoster, payment });
          expect(invoice.subtotalPence).toBe(payment.amountPence);
          expect(invoice.totalPence).toBe(payment.amountPence);
          expect(invoice.lineItems).toHaveLength(1);
          expect(invoice.lineItems[0].amountPence).toBe(payment.amountPence);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ─── Property 2: deterministic, well-formed invoice number ───────────────────

describe('Property 2: generateInvoiceNumber determinism and format', () => {
  const invoiceNumberRegex = /^INV-\d{8}-[0-9A-Z]{6}$/;

  it('is deterministic and always matches the expected regex', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.date({
          min: new Date(Date.UTC(2000, 0, 1)),
          max: new Date(Date.UTC(2100, 0, 1)),
          noInvalidDate: true,
        }),
        (gigId, musicianId, issueDate) => {
          const a = generateInvoiceNumber(gigId, musicianId, issueDate);
          const b = generateInvoiceNumber(gigId, musicianId, issueDate);
          expect(a).toBe(b);
          expect(a).toMatch(invoiceNumberRegex);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ─── Property 3: canGenerateInvoice is allowed IFF accepted AND paid ─────────

describe('Property 3: canGenerateInvoice equivalence', () => {
  it('allowed IFF accepted (status + membership) AND payment paid', () => {
    fc.assert(
      fc.property(
        applicationStatusArb,
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 0, maxLength: 4 }),
        fc.boolean(),
        fc.option(paymentArb(), { nil: null }),
        (applicationStatus, musicianId, otherIds, include, payment) => {
          const acceptedMusicianIds = include
            ? [...otherIds, musicianId]
            : otherIds.filter((id) => id !== musicianId);

          const result = canGenerateInvoice({
            applicationStatus,
            acceptedMusicianIds,
            musicianId,
            payment,
          });

          const expectedAllowed =
            applicationStatus === 'accepted' &&
            acceptedMusicianIds.includes(musicianId) &&
            payment !== null &&
            payment.status === 'paid';

          expect(result.allowed).toBe(expectedAllowed);
          if (!result.allowed) {
            expect(typeof result.reason).toBe('string');
            expect(result.reason.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 300 }
    );
  });
});

// ─── Property 4: currency formatting round-trips to pounds ───────────────────

describe('Property 4: formatCurrencyPence parses back to pounds', () => {
  it('formatted string parses to penceToPounds within rounding', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9999900 }), (amountPence) => {
        const formatted = formatCurrencyPence(amountPence, '£');
        const parsed = parseFloat(formatted.replace('£', ''));
        expect(parsed).toBeCloseTo(penceToPounds(amountPence), 2);
      }),
      { numRuns: 300 }
    );
  });
});
