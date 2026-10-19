# Implementation Plan: Gig Invoices

## Overview

This implementation plan covers the Gig Invoices feature: the `gig_payments` data model and RLS, a mock-first invoice service with pure helpers, mock fixtures, Jest and fast-check tests, a pure HTML renderer, the expo-print plus expo-sharing PDF export service, the gated export-button component, the gig-detail wiring, and the Kiro spec plus Supabase configuration report. Tasks are ordered to build the schema and types first, then the pure logic and its tests, then the native PDF pipeline and UI, then the documentation. Tasks already delivered are marked `[x]`.

## Tasks

- [x] 1. Create migration `src/supabase/migrations/0003_gig_payments.sql` (additive, idempotent, following `0002_amplify_recipients.sql` style) with the `gig_payments` table: id, gig_id (FK gigs ON DELETE CASCADE), musician_id (FK profiles ON DELETE CASCADE), amount_pence (CHECK 1..9999900), currency (DEFAULT 'gbp'), status (DEFAULT 'pending' CHECK IN ('pending','paid')), invoice_number (nullable), paid_at (nullable), created_at, updated_at, and the `uq_gig_payment_gig_musician` unique constraint
- [x] 2. In the same migration add the `gig_payments_updated_at` BEFORE UPDATE trigger, the `idx_gig_payments_musician_id` and `idx_gig_payments_gig_id` indexes, and the `uq_gig_payments_invoice_number` partial unique index (WHERE invoice_number IS NOT NULL)
- [x] 3. In the same migration enable RLS and add the four policies: musicians read own (`auth.uid() = musician_id`); hosters read/insert/update for their own gigs (`EXISTS gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()`); no musician writes
- [x] 4. Consolidate the `gig_payments` table, indexes, trigger, and all four RLS policies into `src/supabase/schema.sql` (plain CREATE style) after the `amplify_payments` section, and update the top-of-file Tables comment list
- [x] 5. Add `GigPaymentRow` / `GigPaymentInsert` / `GigPaymentUpdate` (snake_case) to `src/supabase/types.ts` and register them under `Database['public']['Tables'].gig_payments`
- [x] 6. Add camelCase domain types to `src/types/index.ts`: `GigPaymentStatus`, `GigPayment`, `InvoiceParty`, `Invoice`
- [x] 7. Create `src/data/invoiceService.ts` with `INVOICE_CONFIG` and the pure currency helpers `formatCurrencyPence`, `poundsToPence`, `penceToPounds`
- [x] 8. Add the deterministic `generateInvoiceNumber(gigId, musicianId, issueDate)` (`INV-YYYYMMDD-<short>`, stable FNV-1a token) to `invoiceService.ts`
- [x] 9. Add the `canGenerateInvoice(...)` eligibility rule (accepted AND paid, with a specific reason per failure) to `invoiceService.ts`
- [x] 10. Add the pure `buildInvoice({ gig, musician, hoster, payment, issueDate? })` invoice assembler to `invoiceService.ts`
- [x] 11. Add the mock-first `getGigPaymentForMusician(gigId, musicianId)` data accessor and the `mapRowToGigPayment` snake_case to camelCase mapper to `invoiceService.ts`
- [x] 12. Create `src/data/mockGigPayments.ts` with `MOCK_GIG_PAYMENTS` (a paid gig-9 row and a pending gig-5 row for musician-1)
- [x] 13. Create `src/data/invoiceHtml.ts` with the pure `renderInvoiceHtml(invoice)` returning a self-contained HTML document (inline CSS, no external assets) and an `escapeHtml` helper
- [x] 14. Create `src/services/invoicePdfService.ts` with `exportInvoicePdf(invoice)` using `Print.printToFileAsync` then `Sharing.shareAsync` (expo-print and expo-sharing isolated to this file)
- [x] 15. Create `src/components/InvoiceExportButton.tsx` (presentational, theme/Ionicons/Pressable conventions) gating on `canGenerateInvoice`: hidden when not accepted, disabled-with-reason when not yet paid, enabled when accepted and paid; on press builds the invoice and calls `exportInvoicePdf`
- [x] 16. Wire the export control into `src/app/gig/[id]/index.tsx`: for the musician view, fetch the payment via `getGigPaymentForMusician` in an effect and render `<InvoiceExportButton />`
- [x] 17. Write unit tests for `invoiceService` pure functions (currency helpers, deterministic invoice number, `canGenerateInvoice`, `buildInvoice`)
- [x] 18. Write property tests (fast-check) for `invoiceService`: total equals subtotal equals `payment.amountPence`; `canGenerateInvoice` allowed only when accepted AND paid
- [x] 19. Write renderer tests for `renderInvoiceHtml` (contains invoice number, both party names, gig title/venue/date, formatted total, the word PAID, payment reference; HTML-special characters escaped)
- [x] 20. Write component tests for `InvoiceExportButton` (hidden / disabled-with-reason / enabled plus export triggered), mocking the PDF service and expo-print / expo-sharing
- [ ] 21. Author the Kiro spec at `.kiro/specs/gig-invoices/` (requirements.md, design.md, tasks.md) and the standalone `supabase-report.md` describing exactly what to configure in Supabase

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3"] },
    { "id": 1, "tasks": ["4", "5", "6"] },
    { "id": 2, "tasks": ["7", "8", "9", "10"] },
    { "id": 3, "tasks": ["11", "12", "13"] },
    { "id": 4, "tasks": ["14", "15", "17", "18", "19"] },
    { "id": 5, "tasks": ["16", "20"] },
    { "id": 6, "tasks": ["21"] }
  ]
}
```

## Notes

- Development uses local mock data throughout. `getGigPaymentForMusician` is the only non-pure function; it reads `MOCK_GIG_PAYMENTS` when `supabase === null` and queries `gig_payments` otherwise. No live Supabase connection is required during development.
- Amounts are stored in PENCE (GBP). The app layer speaks whole pounds (`gig.pay`); convert at the service boundary with `poundsToPence` / `penceToPounds`.
- Eligibility is the single rule `canGenerateInvoice`: a musician must be accepted (application `accepted` AND id in `gig.acceptedMusicianIds`) AND have a `gig_payments` row with `status === 'paid'`.
- The feature adds no RPC, storage bucket, Edge Function, or secret. Only the `gig_payments` table, its indexes, trigger, and four RLS policies are new.
- Native modules (expo-print, expo-sharing) are isolated to `src/services/invoicePdfService.ts`; the invoice assembly and HTML rendering stay pure and unit-testable under jest-expo.
- Property-based tests use `fast-check`, already a devDependency.
- `BACKEND_SETUP.md` is gitignored and not in the working tree, so the authoritative Supabase setup record for this feature is `supabase-report.md` in this spec. Fold its steps into the private `BACKEND_SETUP.md`.
