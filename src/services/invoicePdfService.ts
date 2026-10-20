/**
 * Invoice PDF export service.
 *
 * ─── Role ────────────────────────────────────────────────────────────────────
 * Turns an {@link Invoice} model into a shareable PDF file using the Expo
 * standard pipeline (confirmed for SDK 57):
 *   1. expo-print `printToFileAsync({ html })` renders the invoice HTML to a PDF
 *      in the app cache and returns its `uri`.
 *   2. expo-sharing `shareAsync(uri, ...)` opens the native share sheet so the
 *      musician can save, email, or AirDrop the invoice.
 *
 * ─── Native-module isolation ─────────────────────────────────────────────────
 * The expo-print / expo-sharing imports are isolated to THIS file. The pure
 * invoice logic (model assembly in invoiceService.ts and HTML rendering in
 * invoiceHtml.ts) imports no native modules, so it stays unit-testable without
 * a native runtime. Tests mock this module (and expo-print/expo-sharing).
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { renderInvoiceHtml } from '@/data/invoiceHtml';
import type { Invoice } from '@/types';

/**
 * Renders the invoice to a PDF and, when sharing is available on the device,
 * presents the native share sheet. Returns the generated file `uri` so the
 * caller can surface or reuse it.
 *
 * @throws if the PDF could not be generated.
 */
export async function exportInvoicePdf(invoice: Invoice): Promise<{ uri: string }> {
  const html = renderInvoiceHtml(invoice);

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Invoice ${invoice.invoiceNumber}`,
    });
  }

  return { uri };
}
