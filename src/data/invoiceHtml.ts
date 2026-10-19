/**
 * Pure HTML renderer for a professional gig invoice.
 *
 * ─── Purity ──────────────────────────────────────────────────────────────────
 * `renderInvoiceHtml` is a pure, side-effect-free function. It imports NO React
 * Native / native modules (expo-print, expo-sharing, etc.) so it can be unit
 * tested under plain Jest without a native runtime. The PDF pipeline that feeds
 * this HTML to expo-print lives in src/services/invoicePdfService.ts.
 *
 * ─── Self-contained document ─────────────────────────────────────────────────
 * expo-print on iOS cannot load local or remote asset URLs referenced from the
 * HTML, so the document is fully self-contained: inline CSS only, no external
 * images or fonts, and a <meta viewport> tag per the expo-print guidance.
 *
 * ─── Standard invoice fields ─────────────────────────────────────────────────
 * The rendered document carries every field a standards-aware invoice needs:
 * the word INVOICE, a unique invoice number, the issue date, the seller block
 * (musician), the buyer / bill-to block (hoster or venue), a description of the
 * service (gig title, venue, date, start-end time), a line-item table with
 * subtotal and total, the currency, a PAID payment status with reference and
 * paid date, and a tax / sole-trader note.
 */

import { formatCurrencyPence } from '@/data/invoiceService';
import type { Invoice, InvoiceParty } from '@/types';

/**
 * Escapes the five HTML-significant characters so interpolated user text (party
 * names, gig titles, addresses, etc.) cannot break the document or inject
 * markup. Applied to every interpolated string value below.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Formats an ISO timestamp/date into a human-readable date, escaped for HTML. */
function formatDisplayDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(iso);
  }
  const formatted = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return escapeHtml(formatted);
}

/** Renders a party (seller/buyer) block: name, address lines, optional email. */
function renderPartyBlock(party: InvoiceParty): string {
  const addressLines = party.addressLines
    .filter((line) => line.trim().length > 0)
    .map((line) => `<div class="party-line">${escapeHtml(line)}</div>`)
    .join('');
  const email = party.email
    ? `<div class="party-line party-email">${escapeHtml(party.email)}</div>`
    : '';
  return `
    <div class="party-name">${escapeHtml(party.name)}</div>
    ${addressLines}
    ${email}
  `;
}

/** Renders the line-item table rows (one per invoice line item). */
function renderLineItems(invoice: Invoice): string {
  return invoice.lineItems
    .map(
      (item) => `
        <tr>
          <td class="item-desc">${escapeHtml(item.description)}</td>
          <td class="item-amount">${escapeHtml(formatCurrencyPence(item.amountPence, invoice.currency))}</td>
        </tr>
      `
    )
    .join('');
}

/**
 * Renders a complete, self-contained HTML invoice document from the given
 * {@link Invoice} model. Pure: depends only on its argument.
 */
export function renderInvoiceHtml(invoice: Invoice): string {
  const currencyCode = escapeHtml(invoice.currency.toUpperCase());
  const total = escapeHtml(formatCurrencyPence(invoice.totalPence, invoice.currency));
  const subtotal = escapeHtml(formatCurrencyPence(invoice.subtotalPence, invoice.currency));

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #1a1a2e;
        margin: 0;
        padding: 32px;
        font-size: 13px;
        line-height: 1.5;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 3px solid #7c3aed;
        padding-bottom: 16px;
        margin-bottom: 24px;
      }
      .title { font-size: 34px; font-weight: 800; letter-spacing: 2px; color: #7c3aed; margin: 0; }
      .meta { text-align: right; }
      .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
      .meta-value { font-size: 14px; font-weight: 600; }
      .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
      .party { flex: 1; }
      .party-heading { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 6px; }
      .party-name { font-size: 15px; font-weight: 700; }
      .party-line { font-size: 13px; color: #374151; }
      .party-email { color: #2563eb; }
      .section { margin-bottom: 24px; }
      .section-heading { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 6px; }
      .service-grid { display: flex; flex-wrap: wrap; gap: 16px; }
      .service-item { min-width: 140px; }
      .service-label { font-size: 11px; color: #6b7280; }
      .service-value { font-size: 14px; font-weight: 600; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 8px 0; }
      th.amount, td.item-amount { text-align: right; }
      td { padding: 10px 0; border-bottom: 1px solid #f1f0f6; vertical-align: top; }
      .item-amount { font-weight: 600; white-space: nowrap; }
      .totals { margin-top: 12px; margin-left: auto; width: 240px; }
      .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
      .totals-row.total { border-top: 2px solid #1a1a2e; font-size: 16px; font-weight: 800; margin-top: 4px; padding-top: 10px; }
      .status-badge {
        display: inline-block;
        background: #34c759;
        color: #ffffff;
        font-weight: 700;
        letter-spacing: 1px;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 13px;
      }
      .payment-details { margin-top: 10px; color: #374151; }
      .payment-details div { padding: 2px 0; }
      .tax-note {
        margin-top: 24px;
        padding: 12px 16px;
        background: #f1f0f6;
        border-radius: 8px;
        font-size: 12px;
        color: #6b7280;
      }
      .currency-note { font-size: 11px; color: #6b7280; margin-top: 4px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="title">INVOICE</h1>
        <div class="currency-note">All amounts in ${currencyCode}</div>
      </div>
      <div class="meta">
        <div class="meta-label">Invoice number</div>
        <div class="meta-value">${escapeHtml(invoice.invoiceNumber)}</div>
        <div class="meta-label" style="margin-top:8px;">Issue date</div>
        <div class="meta-value">${formatDisplayDate(invoice.issueDate)}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-heading">From (Seller)</div>
        ${renderPartyBlock(invoice.seller)}
      </div>
      <div class="party">
        <div class="party-heading">Bill to (Buyer)</div>
        ${renderPartyBlock(invoice.buyer)}
      </div>
    </div>

    <div class="section">
      <div class="section-heading">Service</div>
      <div class="service-grid">
        <div class="service-item">
          <div class="service-label">Gig</div>
          <div class="service-value">${escapeHtml(invoice.gigTitle)}</div>
        </div>
        <div class="service-item">
          <div class="service-label">Venue</div>
          <div class="service-value">${escapeHtml(invoice.venueName)}</div>
        </div>
        <div class="service-item">
          <div class="service-label">Date</div>
          <div class="service-value">${escapeHtml(invoice.gigDate)}</div>
        </div>
        <div class="service-item">
          <div class="service-label">Time</div>
          <div class="service-value">${escapeHtml(invoice.gigStartTime)} &ndash; ${escapeHtml(invoice.gigEndTime)}</div>
        </div>
      </div>
      <div class="service-item" style="margin-top:12px;">
        <div class="service-label">Address</div>
        <div class="service-value">${escapeHtml(invoice.venueAddress)}</div>
      </div>
      <div class="service-item" style="margin-top:12px;">
        <div class="service-label">Description</div>
        <div class="service-value">${escapeHtml(invoice.description)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-heading">Line items</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${renderLineItems(invoice)}
        </tbody>
      </table>
      <div class="totals">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${subtotal}</span>
        </div>
        <div class="totals-row total">
          <span>Total (${currencyCode})</span>
          <span>${total}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-heading">Payment</div>
      <span class="status-badge">${escapeHtml(invoice.paymentStatus.toUpperCase())}</span>
      <div class="payment-details">
        <div>Reference: ${escapeHtml(invoice.paymentReference)}</div>
        <div>Paid on: ${formatDisplayDate(invoice.paidAt)}</div>
      </div>
    </div>

    <div class="tax-note">${escapeHtml(invoice.taxNote)}</div>
  </body>
</html>`;
}
