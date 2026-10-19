/**
 * Unit tests for invoiceService pure functions.
 * Covers currency helpers, deterministic invoice numbers, the eligibility
 * rules, and invoice assembly.
 */

import {
  buildInvoice,
  canGenerateInvoice,
  currencySymbolFor,
  formatCurrencyPence,
  generateInvoiceNumber,
  INVOICE_CONFIG,
  penceToPounds,
  poundsToPence,
} from '@/data/invoiceService';
import type { Gig, GigPayment, InvoiceParty } from '@/types';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

const mockGig: Gig = {
  id: 'gig-9',
  title: "Last Month's Rock Night",
  venueName: 'Exit/In',
  addressLine1: '2208 Elliston Pl',
  addressLine2: '',
  city: 'Nashville',
  postcode: '37203',
  country: 'USA',
  latitude: 36.1529,
  longitude: -86.8032,
  date: '2024-01-10',
  startTime: '21:00',
  endTime: '23:30',
  genres: ['rock'],
  pay: 225,
  description: 'Three-band bill.',
  status: 'past',
  hosterId: 'hoster-1',
  acceptedMusicianIds: ['musician-1'],
};

const paidPayment: GigPayment = {
  id: 'gig-payment-1',
  gigId: 'gig-9',
  musicianId: 'musician-1',
  amountPence: 22500,
  currency: 'gbp',
  status: 'paid',
  invoiceNumber: null,
  paidAt: '2024-01-15T18:30:00.000Z',
  createdAt: '2024-01-15T18:00:00.000Z',
};

const musicianParty: InvoiceParty = {
  name: 'Rae Holloway',
  addressLines: ['1 Music Row', 'Nashville'],
  email: 'rae@example.com',
};

const hosterParty: InvoiceParty = {
  name: 'The Blue Note Lounge',
  addressLines: ['2208 Elliston Pl', 'Nashville'],
};

// ─── formatCurrencyPence ───────────────────────────────────────────────────────

describe('formatCurrencyPence', () => {
  it('formats a whole-pound amount', () => {
    expect(formatCurrencyPence(25000)).toBe('£250.00');
  });

  it('formats zero', () => {
    expect(formatCurrencyPence(0)).toBe('£0.00');
  });

  it('formats a sub-pound amount', () => {
    expect(formatCurrencyPence(5)).toBe('£0.05');
  });

  it('formats a large amount', () => {
    expect(formatCurrencyPence(9999900)).toBe('£99999.00');
  });

  it('defaults to the GBP symbol when no currency is given', () => {
    expect(formatCurrencyPence(12345)).toBe('£123.45');
  });

  it('derives the symbol from the currency code', () => {
    expect(formatCurrencyPence(12345, 'gbp')).toBe('£123.45');
    expect(formatCurrencyPence(12345, 'usd')).toBe('$123.45');
    expect(formatCurrencyPence(12345, 'eur')).toBe('€123.45');
  });

  it('does not render £ for a non-GBP currency', () => {
    const usd = formatCurrencyPence(12345, 'usd');
    expect(usd).not.toContain('£');
    expect(usd.startsWith('$')).toBe(true);
  });

  it('falls back to the uppercased code for an unknown currency', () => {
    expect(formatCurrencyPence(12345, 'chf')).toBe('CHF 123.45');
  });
});

// ─── currencySymbolFor ─────────────────────────────────────────────────────────

describe('currencySymbolFor', () => {
  it('defaults to the GBP symbol', () => {
    expect(currencySymbolFor()).toBe('£');
  });

  it('maps known currency codes to their symbol', () => {
    expect(currencySymbolFor('gbp')).toBe('£');
    expect(currencySymbolFor('usd')).toBe('$');
    expect(currencySymbolFor('eur')).toBe('€');
  });

  it('is case-insensitive', () => {
    expect(currencySymbolFor('GBP')).toBe('£');
  });

  it('falls back to the uppercased code for unknown currencies', () => {
    expect(currencySymbolFor('chf')).toBe('CHF ');
  });
});

// ─── poundsToPence / penceToPounds ─────────────────────────────────────────────

describe('poundsToPence / penceToPounds', () => {
  it('converts pounds to pence', () => {
    expect(poundsToPence(225)).toBe(22500);
  });

  it('rounds fractional pennies to the nearest penny', () => {
    expect(poundsToPence(1.014)).toBe(101);
    expect(poundsToPence(1.016)).toBe(102);
  });

  it('converts pence to pounds', () => {
    expect(penceToPounds(22500)).toBe(225);
  });

  it('round-trips whole pounds', () => {
    for (const pounds of [1, 50, 225, 99999]) {
      expect(penceToPounds(poundsToPence(pounds))).toBe(pounds);
    }
  });
});

// ─── generateInvoiceNumber ─────────────────────────────────────────────────────

describe('generateInvoiceNumber', () => {
  const issueDate = new Date(Date.UTC(2024, 0, 31)); // 2024-01-31

  it('matches the INV-YYYYMMDD-<short> format', () => {
    const num = generateInvoiceNumber('gig-9', 'musician-1', issueDate);
    expect(num).toMatch(/^INV-\d{8}-[0-9A-Z]{6}$/);
    expect(num.startsWith('INV-20240131-')).toBe(true);
  });

  it('is deterministic for the same inputs', () => {
    const a = generateInvoiceNumber('gig-9', 'musician-1', issueDate);
    const b = generateInvoiceNumber('gig-9', 'musician-1', issueDate);
    expect(a).toBe(b);
  });

  it('differs for different gig/musician pairs', () => {
    const a = generateInvoiceNumber('gig-9', 'musician-1', issueDate);
    const b = generateInvoiceNumber('gig-5', 'musician-1', issueDate);
    expect(a).not.toBe(b);
  });
});

// ─── canGenerateInvoice ────────────────────────────────────────────────────────

describe('canGenerateInvoice', () => {
  it('allows when accepted and payment is paid', () => {
    const result = canGenerateInvoice({
      applicationStatus: 'accepted',
      acceptedMusicianIds: ['musician-1'],
      musicianId: 'musician-1',
      payment: paidPayment,
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks when application status is not accepted', () => {
    const result = canGenerateInvoice({
      applicationStatus: 'pending',
      acceptedMusicianIds: ['musician-1'],
      musicianId: 'musician-1',
      payment: paidPayment,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toMatch(/not accepted/i);
    }
  });

  it('blocks when musician id is not in acceptedMusicianIds', () => {
    const result = canGenerateInvoice({
      applicationStatus: 'accepted',
      acceptedMusicianIds: ['musician-2'],
      musicianId: 'musician-1',
      payment: paidPayment,
    });
    expect(result.allowed).toBe(false);
  });

  it('blocks when there is no payment record', () => {
    const result = canGenerateInvoice({
      applicationStatus: 'accepted',
      acceptedMusicianIds: ['musician-1'],
      musicianId: 'musician-1',
      payment: null,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toMatch(/no payment/i);
    }
  });

  it('blocks when the payment is still pending', () => {
    const result = canGenerateInvoice({
      applicationStatus: 'accepted',
      acceptedMusicianIds: ['musician-1'],
      musicianId: 'musician-1',
      payment: { ...paidPayment, status: 'pending', paidAt: null },
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toMatch(/not been received/i);
    }
  });
});

// ─── buildInvoice ──────────────────────────────────────────────────────────────

describe('buildInvoice', () => {
  const issueDate = new Date(Date.UTC(2024, 0, 20));

  it('totals equal the payment amount', () => {
    const invoice = buildInvoice({
      gig: mockGig,
      musician: musicianParty,
      hoster: hosterParty,
      payment: paidPayment,
      issueDate,
    });
    expect(invoice.subtotalPence).toBe(22500);
    expect(invoice.totalPence).toBe(22500);
  });

  it('has a single line item for the gig amount', () => {
    const invoice = buildInvoice({
      gig: mockGig,
      musician: musicianParty,
      hoster: hosterParty,
      payment: paidPayment,
      issueDate,
    });
    expect(invoice.lineItems).toHaveLength(1);
    expect(invoice.lineItems[0].amountPence).toBe(22500);
  });

  it('maps the two parties', () => {
    const invoice = buildInvoice({
      gig: mockGig,
      musician: musicianParty,
      hoster: hosterParty,
      payment: paidPayment,
      issueDate,
    });
    expect(invoice.seller).toEqual(musicianParty);
    expect(invoice.buyer).toEqual(hosterParty);
  });

  it('populates the invoice number and payment reference', () => {
    const invoice = buildInvoice({
      gig: mockGig,
      musician: musicianParty,
      hoster: hosterParty,
      payment: paidPayment,
      issueDate,
    });
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{8}-[0-9A-Z]{6}$/);
    expect(invoice.paymentReference).toBe('PAY-gig-payment-1');
    expect(invoice.paymentStatus).toBe('paid');
    expect(invoice.paidAt).toBe('2024-01-15T18:30:00.000Z');
    expect(invoice.currency).toBe('gbp');
    expect(invoice.taxNote).toBe(INVOICE_CONFIG.taxNote);
  });

  it('reuses an already-assigned invoice number', () => {
    const invoice = buildInvoice({
      gig: mockGig,
      musician: musicianParty,
      hoster: hosterParty,
      payment: { ...paidPayment, invoiceNumber: 'INV-20240101-ABC123' },
      issueDate,
    });
    expect(invoice.invoiceNumber).toBe('INV-20240101-ABC123');
  });

  it('does not mutate the input gig or payment', () => {
    const gigCopy = { ...mockGig };
    const paymentCopy = { ...paidPayment };
    buildInvoice({
      gig: mockGig,
      musician: musicianParty,
      hoster: hosterParty,
      payment: paidPayment,
      issueDate,
    });
    expect(mockGig).toEqual(gigCopy);
    expect(paidPayment).toEqual(paymentCopy);
  });
});
