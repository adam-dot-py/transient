/**
 * Unit tests for the pure invoice HTML renderer.
 *
 * These tests import NO native modules (expo-print / expo-sharing), so the
 * renderer stays verifiable under plain Jest. They assert that every required
 * invoice field appears in the output and that HTML-special characters in
 * interpolated values are escaped.
 */

import { escapeHtml, renderInvoiceHtml } from '@/data/invoiceHtml';
import { formatCurrencyPence } from '@/data/invoiceService';
import type { Invoice } from '@/types';

// ─── Fixture ─────────────────────────────────────────────────────────────────

const baseInvoice: Invoice = {
  invoiceNumber: 'INV-20240115-AB12CD',
  issueDate: '2024-01-16T10:00:00.000Z',
  seller: {
    name: 'Rae Holloway',
    addressLines: ['12 Treble Street', 'London', 'EC1A 1AA'],
    email: 'rae@example.com',
  },
  buyer: {
    name: 'The Blue Note Lounge',
    addressLines: ['1 Jazz Lane', 'London'],
  },
  gigTitle: "Last Month's Rock Night",
  gigDate: '2024-01-14',
  gigStartTime: '20:00',
  gigEndTime: '23:00',
  venueName: 'The Blue Note Lounge',
  venueAddress: '1 Jazz Lane, London, EC2A 2BB',
  description: 'Live music performance at The Blue Note Lounge on 2024-01-14.',
  lineItems: [{ description: 'Performance fee', amountPence: 22500 }],
  subtotalPence: 22500,
  totalPence: 22500,
  currency: 'gbp',
  taxNote: 'Invoiced as a self-employed sole trader.',
  paymentStatus: 'paid',
  paymentReference: 'PAY-gig-payment-1',
  paidAt: '2024-01-15T18:30:00.000Z',
};

// ─── escapeHtml ──────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('escapes all five HTML-significant characters', () => {
    expect(escapeHtml('& < > " \'')).toBe('&amp; &lt; &gt; &quot; &#39;');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeHtml('Rae Holloway')).toBe('Rae Holloway');
  });
});

// ─── renderInvoiceHtml ───────────────────────────────────────────────────────

describe('renderInvoiceHtml', () => {
  it('returns a self-contained HTML document with a viewport meta tag', () => {
    const html = renderInvoiceHtml(baseInvoice);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('name="viewport"');
    // No external asset references (expo-print on iOS cannot load them).
    expect(html).not.toMatch(/<img\s/i);
    expect(html).not.toContain('http://');
  });

  it('renders the INVOICE heading and the invoice number', () => {
    const html = renderInvoiceHtml(baseInvoice);
    expect(html).toContain('INVOICE');
    expect(html).toContain('INV-20240115-AB12CD');
  });

  it('renders both party names', () => {
    const html = renderInvoiceHtml(baseInvoice);
    expect(html).toContain('Rae Holloway');
    expect(html).toContain('The Blue Note Lounge');
  });

  it('renders the gig title, venue, and date', () => {
    const html = renderInvoiceHtml(baseInvoice);
    // Title contains an apostrophe → it should be escaped.
    expect(html).toContain('Last Month&#39;s Rock Night');
    expect(html).toContain('The Blue Note Lounge');
    expect(html).toContain('2024-01-14');
    expect(html).toContain('20:00');
    expect(html).toContain('23:00');
  });

  it('renders the formatted subtotal and total with currency', () => {
    const html = renderInvoiceHtml(baseInvoice);
    expect(html).toContain(formatCurrencyPence(22500)); // £225.00
    expect(html).toContain('GBP');
  });

  it('renders PAID status with the payment reference and paid date', () => {
    const html = renderInvoiceHtml(baseInvoice);
    expect(html).toContain('PAID');
    expect(html).toContain('PAY-gig-payment-1');
    // Paid date rendered in a human-readable form.
    expect(html).toContain('Paid on:');
  });

  it('renders the tax note', () => {
    const html = renderInvoiceHtml(baseInvoice);
    expect(html).toContain('self-employed sole trader');
  });

  it('escapes HTML-special characters in interpolated values', () => {
    const dangerous: Invoice = {
      ...baseInvoice,
      seller: { name: 'Tom & <b>Jerry</b>', addressLines: ['Line & <1>'] },
      buyer: { name: 'A "Quoted" Venue', addressLines: [] },
    };
    const html = renderInvoiceHtml(dangerous);
    expect(html).toContain('Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;');
    expect(html).toContain('Line &amp; &lt;1&gt;');
    expect(html).toContain('A &quot;Quoted&quot; Venue');
    // The raw dangerous markup must NOT leak through.
    expect(html).not.toContain('<b>Jerry</b>');
  });
});
