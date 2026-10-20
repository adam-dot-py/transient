/**
 * Invoice service for musician gig payouts.
 *
 * Lets a musician who was ACCEPTED for a gig AND has a PAID payment record build
 * a professional invoice model from the gig, the two parties, and the payment.
 * The actual PDF rendering and UI live in a later feature; this module is the
 * pure data + business-rules layer plus a single mock-first data accessor.
 *
 * ─── Purity ──────────────────────────────────────────────────────────────────
 * Every exported function except `getGigPaymentForMusician` is a pure,
 * side-effect-free function. `generateInvoiceNumber` is intentionally
 * deterministic (no randomness, no clock reads beyond the supplied date) so it
 * is fully testable.
 *
 * ─── Mock-First ──────────────────────────────────────────────────────────────
 * `getGigPaymentForMusician` follows the project's mock-first pattern (see
 * src/services/stripeService.ts): when `supabase === null` it reads the
 * in-memory MOCK_GIG_PAYMENTS fixture; otherwise it queries the real
 * `gig_payments` table and maps the snake_case Row to the camelCase domain type.
 *
 * ─── Currency ────────────────────────────────────────────────────────────────
 * The app is UK-oriented. Amounts are stored and passed around in PENCE (GBP),
 * matching the Amplify convention. gig.pay is in whole pounds; use
 * `poundsToPence` at the boundary.
 */

import { MOCK_GIG_PAYMENTS } from '@/data/mockGigPayments';
import { supabase } from '@/supabase/client';
import type { GigPaymentRow } from '@/supabase/types';
import type { ApplicationStatus, Gig, GigPayment, Invoice, InvoiceParty } from '@/types';

/**
 * Minimal structural view of the Supabase query builder used here. `supabase`
 * is typed as `null` until the real client is wired in (see client.ts), which
 * narrows to `never` after the `if (!supabase)` guard; we cast through this
 * structural type at the call site so the query type-checks. Mirrors the
 * narrowing done in src/services/stripeService.ts.
 */
interface SupabaseQueryClient {
  from(table: string): {
    select(columns?: string): {
      eq(
        column: string,
        value: string
      ): {
        eq(
          column: string,
          value: string
        ): {
          maybeSingle(): Promise<{
            data: GigPaymentRow | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
}

// ─── Config ──────────────────────────────────────────────────────────────────

export const INVOICE_CONFIG = {
  /** ISO currency code used across the app (GBP). */
  currency: 'gbp',
  /** Symbol rendered before amounts. */
  currencySymbol: '£',
  /**
   * Short tax note shown on the invoice. Transient musicians invoice as
   * self-employed sole traders; VAT is not charged unless explicitly stated.
   */
  taxNote: 'Invoiced as a self-employed sole trader. No VAT is charged unless otherwise stated.',
} as const;

// ─── Pure helpers: currency ────────────────────────────────────────────────────

/**
 * Maps a lowercase ISO currency code to its display symbol. Kept small and
 * explicit: the app is GBP-oriented, but the symbol must track the payment's
 * `currency` field rather than being hardcoded, so a non-GBP row renders its
 * own symbol instead of a misleading '£'.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  gbp: '£',
  usd: '$',
  eur: '€',
};

/**
 * Resolves the display symbol for a currency code. Known codes map to their
 * symbol (e.g. 'gbp' => '£'); unknown codes fall back to the uppercased code
 * followed by a space (e.g. 'chf' => 'CHF '), so the amount is never labelled
 * with the wrong symbol.
 */
export function currencySymbolFor(currency: string = INVOICE_CONFIG.currency): string {
  const code = currency.trim().toLowerCase();
  return CURRENCY_SYMBOLS[code] ?? `${currency.trim().toUpperCase()} `;
}

/**
 * Formats an amount given in pence as a currency string, deriving the symbol
 * from the currency code, e.g. `formatCurrencyPence(25000)` => `'£250.00'`
 * (GBP by default) and `formatCurrencyPence(25000, 'usd')` => `'$250.00'`.
 *
 * The `currency` argument defaults to `INVOICE_CONFIG.currency` ('gbp') so
 * existing call sites that pass only an amount keep rendering '£'.
 */
export function formatCurrencyPence(
  amountPence: number,
  currency: string = INVOICE_CONFIG.currency
): string {
  const pounds = amountPence / 100;
  return `${currencySymbolFor(currency)}${pounds.toFixed(2)}`;
}

/** Converts whole/fractional pounds to pence (rounded to the nearest penny). */
export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

/** Converts pence to pounds (may be fractional). */
export function penceToPounds(pence: number): number {
  return pence / 100;
}

// ─── Pure helpers: invoice number ──────────────────────────────────────────────

/**
 * Builds a deterministic, human-readable invoice number of the form
 * `INV-YYYYMMDD-<short>`, where `<short>` is a stable 6-character uppercase
 * token derived from `gigId` + `musicianId`. Same inputs always produce the
 * same number (no randomness), which makes it safe to test and idempotent to
 * regenerate.
 */
export function generateInvoiceNumber(gigId: string, musicianId: string, issueDate: Date): string {
  // Guard against an Invalid Date so the number is always well-formed.
  const safeDate = Number.isNaN(issueDate.getTime()) ? new Date(0) : issueDate;
  const yyyy = safeDate.getUTCFullYear().toString().padStart(4, '0');
  const mm = (safeDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = safeDate.getUTCDate().toString().padStart(2, '0');
  const datePart = `${yyyy}${mm}${dd}`;
  const short = stableShortToken(`${gigId}:${musicianId}`);
  return `INV-${datePart}-${short}`;
}

/**
 * Deterministic 6-char uppercase base36 token from a seed string. Uses a plain
 * 32-bit FNV-1a hash — no randomness, no dependencies — so it is stable across
 * runtimes and fully testable.
 */
function stableShortToken(seed: string): string {
  let hash = 0x811c9dc5; // FNV-1a offset basis
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    // 32-bit FNV prime multiply, kept in 32-bit unsigned space.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

// ─── Business rules ────────────────────────────────────────────────────────────

/** Result of the invoice-eligibility check. */
export type CanGenerateInvoiceResult = { allowed: true } | { allowed: false; reason: string };

/**
 * Decides whether a musician may generate an invoice for a gig.
 *
 * Allowed only when BOTH hold:
 *   1. The musician was accepted — their application status is 'accepted' AND
 *      their id appears in the gig's acceptedMusicianIds.
 *   2. A payment record exists for them and its status is 'paid'.
 *
 * Returns a specific `reason` for each failure so the UI can explain the block.
 */
export function canGenerateInvoice(params: {
  applicationStatus: ApplicationStatus;
  acceptedMusicianIds: string[];
  musicianId: string;
  payment: GigPayment | null;
}): CanGenerateInvoiceResult {
  const { applicationStatus, acceptedMusicianIds, musicianId, payment } = params;

  const isAccepted = applicationStatus === 'accepted' && acceptedMusicianIds.includes(musicianId);
  if (!isAccepted) {
    return {
      allowed: false,
      reason: 'You were not accepted for this gig.',
    };
  }

  if (!payment) {
    return {
      allowed: false,
      reason: 'No payment record exists for this gig yet.',
    };
  }

  if (payment.status !== 'paid') {
    return {
      allowed: false,
      reason: 'Payment for this gig has not been received yet.',
    };
  }

  return { allowed: true };
}

// ─── Invoice assembly ───────────────────────────────────────────────────────────

/**
 * Assembles an {@link Invoice} from a gig, its parties, and a paid payment.
 *
 * Pure: no clock reads other than the supplied `issueDate` (defaults to now),
 * no mutation of inputs. The invoice has a single line item describing the
 * performance; subtotal and total both equal `payment.amountPence`. The invoice
 * number is taken from `payment.invoiceNumber` when already assigned, otherwise
 * generated deterministically.
 */
export function buildInvoice(params: {
  gig: Gig;
  musician: InvoiceParty;
  hoster: InvoiceParty;
  payment: GigPayment;
  issueDate?: Date;
}): Invoice {
  const { gig, musician, hoster, payment } = params;
  const issueDate = params.issueDate ?? new Date();

  const invoiceNumber =
    payment.invoiceNumber ?? generateInvoiceNumber(gig.id, payment.musicianId, issueDate);

  const venueAddress = formatVenueAddress(gig);
  const description = `Live music performance at ${gig.venueName} on ${gig.date}.`;

  const lineItems = [
    {
      description: `${gig.title} — performance at ${gig.venueName} (${gig.date}, ${gig.startTime}–${gig.endTime})`,
      amountPence: payment.amountPence,
    },
  ];

  return {
    invoiceNumber,
    issueDate: issueDate.toISOString(),
    seller: musician,
    buyer: hoster,
    gigTitle: gig.title,
    gigDate: gig.date,
    gigStartTime: gig.startTime,
    gigEndTime: gig.endTime,
    venueName: gig.venueName,
    venueAddress,
    description,
    lineItems,
    subtotalPence: payment.amountPence,
    totalPence: payment.amountPence,
    currency: payment.currency,
    taxNote: INVOICE_CONFIG.taxNote,
    paymentStatus: 'paid',
    paymentReference: `PAY-${payment.id}`,
    paidAt: payment.paidAt ?? issueDate.toISOString(),
  };
}

/** Renders a gig's venue address as a single comma-separated display string. */
function formatVenueAddress(gig: Gig): string {
  const parts = [gig.addressLine1, gig.addressLine2, gig.city, gig.postcode, gig.country];
  return parts
    .map((p) => (p ?? '').trim())
    .filter((p) => p.length > 0)
    .join(', ');
}

// ─── Mock-first data access ─────────────────────────────────────────────────────

/** Maps a snake_case gig_payments Row to the camelCase domain model. */
function mapRowToGigPayment(row: GigPaymentRow): GigPayment {
  return {
    id: row.id,
    gigId: row.gig_id,
    musicianId: row.musician_id,
    amountPence: row.amount_pence,
    currency: row.currency,
    status: row.status,
    invoiceNumber: row.invoice_number,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

/**
 * Fetches the payment record for a (gig, musician) pair, or null if none exists.
 *
 * Mock-first: when Supabase is not configured, reads MOCK_GIG_PAYMENTS; otherwise
 * queries the `gig_payments` table (RLS limits a musician to their own rows).
 */
export async function getGigPaymentForMusician(
  gigId: string,
  musicianId: string
): Promise<GigPayment | null> {
  if (!supabase) {
    const match = MOCK_GIG_PAYMENTS.find((p) => p.gigId === gigId && p.musicianId === musicianId);
    return match ?? null;
  }

  const client = supabase as unknown as SupabaseQueryClient;
  const { data, error } = await client
    .from('gig_payments')
    .select()
    .eq('gig_id', gigId)
    .eq('musician_id', musicianId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? 'Failed to fetch gig payment');
  }

  return data ? mapRowToGigPayment(data) : null;
}
