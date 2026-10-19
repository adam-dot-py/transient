# Design Document

## Overview

This design adds the ability for an accepted, paid musician to export a professional PDF invoice for a gig. It introduces the missing `gig_payments` data model (a musician payout record, distinct from the hoster's Amplify boost purchase), a pure mock-first invoice service, a pure HTML renderer, a PDF export pipeline on expo-print plus expo-sharing, and a gated UI control on the gig detail screen.

The architecture follows the existing patterns: pure, side-effect-free service functions for logic (Jest plus fast-check tested), a mock-first data accessor for the `supabase === null` dev loop, native modules isolated to a single integration service, and strict snake_case to camelCase translation at the service boundary.

## Architecture

### High-Level Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  Gig detail screen  src/app/gig/[id]/index.tsx                     │
│    • musician view: fetches payment via getGigPaymentForMusician   │
│    • renders <InvoiceExportButton gig payment sellerName buyerName>│
└──────────────────────────────────────────────────────────────────┘
                 │ press (only when eligible)
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  src/components/InvoiceExportButton.tsx  (presentational)          │
│    • canGenerateInvoice() gates render: hidden / disabled / enabled│
│    • buildInvoice() → exportInvoicePdf()                           │
└──────────────────────────────────────────────────────────────────┘
          │ pure assembly                 │ native pipeline
          ▼                               ▼
┌───────────────────────────┐   ┌────────────────────────────────────┐
│ src/data/invoiceService.ts│   │ src/services/invoicePdfService.ts    │
│  buildInvoice (pure)      │   │  Print.printToFileAsync({ html })    │
│  canGenerateInvoice (pure)│   │  Sharing.shareAsync(uri, ...)        │
│  generateInvoiceNumber    │   │  (expo-print / expo-sharing isolated)│
│  formatCurrencyPence       │   └────────────────────────────────────┘
│  poundsToPence/penceToPounds│             │ renders
│  getGigPaymentForMusician  │             ▼
│   (mock-first data access) │   ┌────────────────────────────────────┐
└───────────────────────────┘   │ src/data/invoiceHtml.ts              │
          │                      │  renderInvoiceHtml (pure, no native) │
          ▼                      └────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  Data layer (mock-first → Supabase)                                │
│   src/data/mockGigPayments.ts   ⇄   gig_payments table (RLS)       │
└──────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Separate payout model from Amplify.** `amplify_payments` records a hoster's 1.79 GBP Amplify boost. It is not a musician payout and cannot represent "a musician got paid for a gig". A dedicated `gig_payments` table fills that gap and is the source data an invoice needs.

2. **Amounts in pence.** The app layer speaks whole pounds (`gig.pay`, 1..99999). The database and service store PENCE (`amount_pence`, 1..9999900), matching the Amplify convention and keeping subtotal/total maths exact. Conversion happens at the service boundary (`poundsToPence` / `penceToPounds`).

3. **Mock-first data access.** `getGigPaymentForMusician` is the only non-pure function: when `supabase === null` it reads `MOCK_GIG_PAYMENTS`; otherwise it queries `gig_payments` and maps the snake_case Row to the camelCase domain type. This mirrors `src/services/stripeService.ts`.

4. **Pure logic, native isolation.** `invoiceService.ts` (assembly, rules, numbering, currency) and `invoiceHtml.ts` (HTML rendering) import no native modules, so they are unit-testable under plain Jest. The only native imports (expo-print, expo-sharing) are isolated to `invoicePdfService.ts`.

5. **Deterministic invoice numbers.** `generateInvoiceNumber` produces `INV-YYYYMMDD-<short>` where `<short>` is a stable 6-char FNV-1a token from `gigId:musicianId`. No randomness, so it is idempotent and fully testable. A `gig_payments.invoice_number` value, once assigned, takes precedence.

6. **Single gating rule.** `canGenerateInvoice` is the one eligibility rule, consumed by both the UI (hidden / disabled-with-reason / enabled) and any assembly path.

## Backend Changes (per backend.md checklist)

This feature is backend-touching. The following states exactly what it adds or changes.

### Tables added

- **`gig_payments`** (new). One row per `(gig, accepted musician)` payout. No other table is modified.

### Columns (gig_payments)

| Column           | Type          | Constraints                                                           |
| ---------------- | ------------- | --------------------------------------------------------------------- |
| `id`             | `uuid`        | PK, DEFAULT `gen_random_uuid()`                                       |
| `gig_id`         | `uuid`        | NOT NULL, FK -> `gigs(id)` ON DELETE CASCADE                          |
| `musician_id`    | `uuid`        | NOT NULL, FK -> `profiles(id)` ON DELETE CASCADE                      |
| `amount_pence`   | `integer`     | NOT NULL, CHECK (`amount_pence` BETWEEN 1 AND 9999900)                |
| `currency`       | `text`        | NOT NULL, DEFAULT `'gbp'`                                             |
| `status`         | `text`        | NOT NULL, DEFAULT `'pending'`, CHECK (`status` IN ('pending','paid')) |
| `invoice_number` | `text`        | NULLABLE                                                              |
| `paid_at`        | `timestamptz` | NULLABLE                                                              |
| `created_at`     | `timestamptz` | NOT NULL, DEFAULT `now()`                                             |
| `updated_at`     | `timestamptz` | NOT NULL, DEFAULT `now()`                                             |

**Unique constraint:** `uq_gig_payment_gig_musician` on `(gig_id, musician_id)` (one payout per musician per gig).

### Indexes added

| Index                            | Definition                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| `idx_gig_payments_musician_id`   | on `gig_payments(musician_id)`                                                      |
| `idx_gig_payments_gig_id`        | on `gig_payments(gig_id)`                                                           |
| `uq_gig_payments_invoice_number` | PARTIAL UNIQUE on `gig_payments(invoice_number)` WHERE `invoice_number IS NOT NULL` |

The partial unique index lets many uninvoiced rows (NULL) coexist while guaranteeing every issued invoice number is globally unique.

### Trigger added

- `gig_payments_updated_at` BEFORE UPDATE, executing the shared `update_updated_at_column()` helper from `schema.sql`, to keep `updated_at` fresh.

### RLS policies added (four, defined in the same migration)

| Policy                                           | Command | Expression                                                                                                |
| ------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------- |
| `Musicians can read own gig payments`            | SELECT  | USING `auth.uid() = musician_id`                                                                          |
| `Hosters can read gig payments for their gigs`   | SELECT  | USING `EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid())`                |
| `Hosters can insert gig payments for their gigs` | INSERT  | WITH CHECK `EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid())`           |
| `Hosters can update gig payments for their gigs` | UPDATE  | USING and WITH CHECK `EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid())` |

**Why these are correct:** A musician reads only their own payout rows, which is exactly what they need to produce their invoice; they are intentionally granted no INSERT or UPDATE. The hoster is the party that actually pays the musician, so the hoster owns writes, gated on gig ownership (the same `EXISTS gigs WHERE hoster_id = auth.uid()` pattern used by the `applications` and `example_songs` policies). No other role can read or write a payout.

### RPCs

**No RPC is required.** The only query is a direct, indexed lookup by `(gig_id, musician_id)` that RLS already constrains. There is no proximity, aggregation, or cross-row computation to push into Postgres, so the PostGIS or SECURITY INVOKER RPC guidance in backend.md does not apply to this feature.

### Storage, Edge Functions, secrets

None. This feature adds no storage bucket, no Edge Function, and no secret.

## Components and Interfaces

### New files

| File                                            | Role                                                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/supabase/migrations/0003_gig_payments.sql` | Additive, idempotent migration creating `gig_payments`, its indexes, trigger, and four RLS policies. |
| `src/data/invoiceService.ts`                    | Pure invoice logic plus the mock-first `getGigPaymentForMusician`.                                   |
| `src/data/invoiceHtml.ts`                       | Pure `renderInvoiceHtml(invoice)` producing a self-contained HTML document.                          |
| `src/data/mockGigPayments.ts`                   | `MOCK_GIG_PAYMENTS` fixtures (a paid gig-9 row and a pending gig-5 row for musician-1).              |
| `src/services/invoicePdfService.ts`             | `exportInvoicePdf(invoice)` via expo-print then expo-sharing. Native modules isolated here.          |
| `src/components/InvoiceExportButton.tsx`        | Presentational, gated export control.                                                                |

### Changed files

| File                         | Change                                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/supabase/schema.sql`    | Consolidated `gig_payments` definition, indexes, trigger, and RLS added after `amplify_payments`; top-of-file table list updated. |
| `src/supabase/types.ts`      | `GigPaymentRow` / `GigPaymentInsert` / `GigPaymentUpdate` added and registered under `Database['public']['Tables'].gig_payments`. |
| `src/types/index.ts`         | `GigPaymentStatus`, `GigPayment`, `InvoiceParty`, `Invoice` domain types added.                                                   |
| `src/app/gig/[id]/index.tsx` | Musician view fetches the payment via `getGigPaymentForMusician` in an effect and renders `<InvoiceExportButton />`.              |

### Invoice_Service surface (`src/data/invoiceService.ts`)

- `INVOICE_CONFIG` — `{ currency: 'gbp', currencySymbol: '£', taxNote }`.
- `formatCurrencyPence(amountPence, symbol?)` — pence to a `£250.00` string.
- `poundsToPence(pounds)` / `penceToPounds(pence)` — boundary conversions.
- `generateInvoiceNumber(gigId, musicianId, issueDate)` — deterministic `INV-YYYYMMDD-<short>`.
- `canGenerateInvoice({ applicationStatus, acceptedMusicianIds, musicianId, payment })` — returns `{ allowed: true }` or `{ allowed: false, reason }`.
- `buildInvoice({ gig, musician, hoster, payment, issueDate? })` — assembles the `Invoice` model.
- `getGigPaymentForMusician(gigId, musicianId)` — mock-first data accessor (the one non-pure function).

## Data Models

### Domain types (`src/types/index.ts`, camelCase)

- `GigPaymentStatus = 'pending' | 'paid'`.
- `GigPayment` — `id`, `gigId`, `musicianId`, `amountPence`, `currency`, `status`, `invoiceNumber: string | null`, `paidAt: string | null`, `createdAt`.
- `InvoiceParty` — `name`, `addressLines: string[]`, optional `email`.
- `Invoice` — `invoiceNumber`, `issueDate`, `seller`, `buyer`, `gigTitle`, `gigDate`, `gigStartTime`, `gigEndTime`, `venueName`, `venueAddress`, `description`, `lineItems: { description, amountPence }[]`, `subtotalPence`, `totalPence`, `currency`, `taxNote`, `paymentStatus: 'paid'`, `paymentReference`, `paidAt`.

### Professional invoice field list and justification

| Field                                  | On the Invoice                                           | Why it is included                                                                                        |
| -------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Invoice number                         | `invoiceNumber`                                          | Every invoice needs a unique reference; required for the seller's records and the buyer's reconciliation. |
| Issue date                             | `issueDate`                                              | Standard invoice metadata and the basis for payment-term and tax-period tracking.                         |
| Seller (musician)                      | `seller`                                                 | The party raising the invoice; identifies who was paid for sole-trader bookkeeping.                       |
| Buyer / bill-to (hoster/venue)         | `buyer`                                                  | The paying party; required so the invoice is addressed correctly.                                         |
| Service description                    | `description`, `gigTitle`, `venueName`, `gigDate`, times | Describes exactly what was supplied (the performance) so the charge is unambiguous.                       |
| Line item + amount                     | `lineItems`                                              | The itemised charge; one line for the performance at the agreed fee.                                      |
| Subtotal / total                       | `subtotalPence`, `totalPence`                            | Standard totals; both equal the payout since there is a single line and no VAT.                           |
| Currency                               | `currency` (GBP)                                         | The app is UK-oriented; amounts are GBP.                                                                  |
| Payment status / reference / paid date | `paymentStatus` (PAID), `paymentReference`, `paidAt`     | Marks the invoice settled and gives a reference for reconciliation.                                       |
| Tax / sole-trader note                 | `taxNote`                                                | Clarifies the musician invoices as a self-employed sole trader and that no VAT is charged unless stated.  |

## Eligibility and Units

- **Eligibility:** a musician may export an invoice only when accepted (`applicationStatus === 'accepted'` AND `musicianId` in `gig.acceptedMusicianIds`) AND a `gig_payments` row exists with `status === 'paid'`. Enforced by `canGenerateInvoice`.
- **Units:** the app speaks whole pounds (`gig.pay`, 1..99999); the database and service store pence (`amount_pence`, 1..9999900). Conversion only at the service boundary.

## PDF Pipeline

- `exportInvoicePdf(invoice)` calls `Print.printToFileAsync({ html: renderInvoiceHtml(invoice) })` to produce a PDF in the app cache, then, if `Sharing.isAvailableAsync()` is true, calls `Sharing.shareAsync(uri, ...)` to present the native share sheet. It returns the generated `{ uri }`.
- **Why expo-print plus expo-sharing:** this is the Expo-standard HTML-to-PDF plus share pipeline, confirmed available for SDK 57, so it needs no custom native module and keeps the pure logic testable. The HTML is fully self-contained (inline CSS, no external assets or fonts) because expo-print on iOS cannot load local or remote asset URLs.

## Testing Strategy

- **Pure unit tests:** `invoiceService` currency helpers, deterministic invoice numbers, the `canGenerateInvoice` rule, and `buildInvoice` assembly.
- **HTML renderer tests:** `renderInvoiceHtml` output contains the invoice number, both party names, gig title/venue/date, the formatted total, the word PAID, and the payment reference, and HTML-special characters are escaped.
- **Property tests (fast-check):** invoice total equals subtotal equals `payment.amountPence` for any valid payment; `canGenerateInvoice` is allowed only when accepted AND paid.
- **Component tests:** `InvoiceExportButton` renders nothing when not accepted, disabled-with-reason when accepted but not paid, and enabled (triggering `exportInvoicePdf`) when accepted AND paid, with expo-print / expo-sharing mocked.
