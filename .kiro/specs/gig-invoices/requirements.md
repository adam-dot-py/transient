# Requirements Document

## Introduction

This specification covers the Gig Invoices feature for Transient, the music gigging marketplace app. It lets a musician who was accepted for a gig AND has been paid for it export a professional PDF invoice detailing the gig, the pay, the two parties, and the standard fields any self-employed performer needs on an invoice.

Transient had no concept of a musician being paid for a gig before this feature. The existing `amplify_payments` table records a hoster's Amplify boost purchase, not a payout to a performer. This feature introduces the missing `gig_payments` table (one row per accepted musician per gig), a mock-first invoice service, a pure HTML renderer, and a PDF export pipeline built on expo-print and expo-sharing.

All backend data is managed through Supabase (PostgreSQL). Development runs against local mock data: the Supabase client (`src/supabase/client.ts`) returns `null` until the environment variables are set, so every data service is mock-first. Amounts are stored in PENCE (GBP); the app layer speaks whole pounds (`gig.pay`) and converts at the service boundary.

## Glossary

- **App**: The Transient cross-platform mobile application (iOS, Android, web).
- **Musician_User**: A user operating the app in the musician role, browsing and applying for gigs.
- **Host_User**: A user operating the app in the hoster role, creating gigs and paying accepted musicians.
- **Gig_Payment**: A row in the `gig_payments` table recording a payout to one accepted musician for one gig. It holds the amount in pence, the currency, a status (`pending` or `paid`), an optional invoice number, and a paid timestamp.
- **Invoice**: The professional invoice model assembled from a gig, its two parties, and a paid Gig_Payment. Rendered to HTML and then to a PDF.
- **Invoice_Service**: The pure data and business-rules module (`src/data/invoiceService.ts`) that builds invoices, gates eligibility, generates invoice numbers, and reads payments mock-first.
- **Invoice_Pdf_Service**: The integration module (`src/services/invoicePdfService.ts`) that renders the invoice HTML to a PDF via expo-print and shares it via expo-sharing.
- **Accepted**: A musician is accepted for a gig when their application status is `accepted` AND their id appears in the gig's `acceptedMusicianIds`.
- **Pence**: The stored unit for all monetary values (GBP minor units). `gig.pay` is whole pounds; `amount_pence` is pounds times 100.

## Requirements

### Requirement 1: Export a PDF Invoice for a Paid Gig

**User Story:** As a musician user who performed and was paid for a gig, I want to export a professional PDF invoice for that gig, so that I have a record for my own accounting and can send it to the hoster or venue.

#### Acceptance Criteria

1. WHEN a Musician_User who is accepted for a gig AND whose Gig_Payment status is `paid` views the gig detail screen, THE App SHALL display an enabled "Export PDF invoice" control.
2. WHEN the Musician_User taps the enabled export control, THE Invoice_Pdf_Service SHALL render the invoice to a PDF file and present the native share sheet so the file can be saved, emailed, or shared.
3. WHILE the PDF is being generated, THE App SHALL show a busy indicator on the export control and prevent a second concurrent export.
4. IF PDF generation fails, THEN THE App SHALL display a user-visible inline error message and leave the control usable for a retry.
5. THE Invoice_Service SHALL assemble the invoice purely from the gig, the two parties, and the paid Gig_Payment, with no clock read other than the supplied issue date (defaulting to now).

### Requirement 2: Invoice Contains Standard Professional Fields

**User Story:** As a musician user, I want my exported invoice to contain all the standard fields of a professional invoice, so that it is acceptable for bookkeeping, tax, and payment reconciliation.

#### Acceptance Criteria

1. THE Invoice SHALL display the word "INVOICE", a unique invoice number, and the issue date.
2. THE Invoice SHALL display a seller block for the musician and a bill-to buyer block for the hoster or venue, each with a name and address lines.
3. THE Invoice SHALL display a description of the service performed, including the gig title, the venue name, the gig date, and the start and end times.
4. THE Invoice SHALL display a line-item table with at least one line item (description and amount), a subtotal, and a total, with all monetary values formatted in GBP.
5. THE Invoice SHALL display the currency code applied to the amounts.
6. THE Invoice SHALL display a payment status of PAID, a payment reference derived from the Gig_Payment id, and the date the payment was settled.
7. THE Invoice SHALL display a tax note stating the musician invoices as a self-employed sole trader and that no VAT is charged unless otherwise stated.
8. WHEN a party name, gig title, address, or other interpolated text contains HTML-significant characters, THE Invoice renderer SHALL escape them so the document cannot be broken or injected.
9. THE Invoice_Service SHALL assign a deterministic, human-readable invoice number of the form `INV-YYYYMMDD-<short>`, where `<short>` is a stable token derived from the gig id and musician id, so the same inputs always produce the same number.

### Requirement 3: Invoice Export Is Gated on Eligibility

**User Story:** As the platform, I want invoice export to be blocked unless the musician was accepted for the gig AND the gig has actually been paid, so that invoices only ever reflect real, settled payouts.

#### Acceptance Criteria

1. IF the Musician_User is not accepted for the gig (application status is not `accepted`, or their id is not in `acceptedMusicianIds`), THEN THE App SHALL NOT display the invoice export control at all.
2. IF the Musician_User is accepted but no Gig_Payment record exists for them, THEN THE App SHALL display the export control in a disabled state with a reason explaining that no payment record exists yet.
3. IF the Musician_User is accepted and a Gig_Payment exists but its status is not `paid`, THEN THE App SHALL display the export control in a disabled state with a reason explaining that payment has not been received yet.
4. WHEN both conditions hold (accepted AND Gig_Payment status is `paid`), THE App SHALL enable the export control.
5. THE Invoice_Service SHALL expose a single `canGenerateInvoice` rule that returns `{ allowed: true }` or `{ allowed: false, reason }`, and both the UI gating and any invoice assembly SHALL honour it.

### Requirement 4: Per-Musician Payment Privacy

**User Story:** As a musician user, I want to see only my own gig payments, so that my earnings are private and no other musician can read them.

#### Acceptance Criteria

1. THE `gig_payments` table SHALL have Row-Level Security enabled, defined in the same migration that creates the table.
2. A Musician_User SHALL be able to SELECT only Gig_Payment rows where they are the musician (`auth.uid() = musician_id`).
3. A Musician_User SHALL NOT be able to INSERT or UPDATE any Gig_Payment row.
4. A Host_User SHALL be able to SELECT, INSERT, and UPDATE Gig_Payment rows only for gigs they own (the gig's `hoster_id` equals `auth.uid()`).
5. WHEN the App runs mock-first (Supabase client is `null`), THE Invoice_Service SHALL read the in-memory mock payments; otherwise it SHALL query the `gig_payments` table, where RLS limits a musician to their own rows.

### Requirement 5: Data Model and Type Sync

**User Story:** As the development team, I want the new payment data model documented and the DB and domain types kept in sync, so that mock data and backend implementation share a single source of truth.

#### Acceptance Criteria

1. THE structural change SHALL land as an additive, idempotent migration at `src/supabase/migrations/0003_gig_payments.sql`, with `src/supabase/schema.sql` updated as the consolidated current state.
2. THE snake_case DB types (`GigPaymentRow`, `GigPaymentInsert`, `GigPaymentUpdate`) SHALL be added to `src/supabase/types.ts` and registered under `Database['public']['Tables'].gig_payments`.
3. THE camelCase domain types (`GigPaymentStatus`, `GigPayment`, `InvoiceParty`, `Invoice`) SHALL be added to `src/types/index.ts`, and the Invoice_Service SHALL translate snake_case rows to camelCase without leaking snake_case into components.
4. THE feature SHALL require no new RPC, storage bucket, Edge Function, or secret.
5. THE Supabase setup steps SHALL be captured in `supabase-report.md` because `BACKEND_SETUP.md` is gitignored and not present in the working tree.
