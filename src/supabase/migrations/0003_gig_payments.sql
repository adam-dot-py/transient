-- =============================================================================
-- 0003_gig_payments.sql
-- Musician gig payouts — the missing "a musician got PAID for a gig" concept.
--
-- Additive and idempotent: safe to run on top of schema.sql + 0001 + 0002
-- repeatedly. This migration is the source of the structural change; schema.sql
-- remains the consolidated current state.
--
-- Context: amplify_payments records a HOSTER's £1.79 Amplify boost purchase and
-- is NOT a musician payout. There was previously no way to represent a musician
-- being paid for performing a gig. This table fills that gap and is the data a
-- musician needs to generate an invoice (see src/data/invoiceService.ts).
--
-- Adds:
--   * gig_payments(...) — one row per (gig, accepted musician) payout, holding
--     the amount in PENCE (the app speaks whole pounds for gig.pay; we store
--     pence so partial amounts and VAT-style maths stay exact), currency,
--     status ('pending' | 'paid'), an optional invoice_number assigned when the
--     payment is first invoiced, and paid_at (set when status becomes 'paid').
--   * update_updated_at_column() BEFORE UPDATE trigger (shared helper from
--     schema.sql) to keep updated_at fresh.
--   * Indexes on musician_id and gig_id, plus a PARTIAL unique index on
--     invoice_number (unique only where invoice_number IS NOT NULL) so many
--     uninvoiced rows can coexist but every issued invoice number is unique.
--
-- Amounts: gig.pay is 1..99999 whole pounds; amount_pence is therefore bounded
-- 1..9999900 (99999 * 100). Conversion pounds -> pence happens at the service
-- boundary (invoiceService.poundsToPence), mirroring the Amplify pence convention.
--
-- RLS (defined in this same migration, mandatory):
--   * A musician may SELECT only their OWN payment rows (auth.uid() = musician_id).
--     This is what lets a musician read the payment to produce their invoice.
--   * The gig's hoster may SELECT / INSERT / UPDATE payments for THEIR OWN gigs
--     (EXISTS check against gigs.hoster_id = auth.uid()), mirroring how the
--     applications and example_songs policies gate on gig ownership. The hoster
--     is the party that actually pays the musician, so they own writes.
--   * Musicians are intentionally NOT granted INSERT/UPDATE — they only read
--     their payments to generate invoices.
-- =============================================================================

-- pgcrypto (gen_random_uuid) is enabled by schema.sql; this guard makes 0003
-- safe to run standalone.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table. ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gig_payments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id         uuid        NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  musician_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_pence   integer     NOT NULL CHECK (amount_pence BETWEEN 1 AND 9999900),
  currency       text        NOT NULL DEFAULT 'gbp',
  status         text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  invoice_number text,
  paid_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_gig_payment_gig_musician UNIQUE (gig_id, musician_id)
);

-- 2. updated_at trigger (shared helper defined in schema.sql). ------------------
DROP TRIGGER IF EXISTS gig_payments_updated_at ON gig_payments;
CREATE TRIGGER gig_payments_updated_at
  BEFORE UPDATE ON gig_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Indexes. -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gig_payments_musician_id ON gig_payments(musician_id);
CREATE INDEX IF NOT EXISTS idx_gig_payments_gig_id ON gig_payments(gig_id);
-- Partial unique index: an invoice number, once assigned, is globally unique,
-- but the many rows that have not been invoiced yet (NULL) do not collide.
CREATE UNIQUE INDEX IF NOT EXISTS uq_gig_payments_invoice_number
  ON gig_payments(invoice_number)
  WHERE invoice_number IS NOT NULL;

-- 4. RLS. -----------------------------------------------------------------------
ALTER TABLE gig_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Musicians can read own gig payments" ON gig_payments;
CREATE POLICY "Musicians can read own gig payments"
  ON gig_payments FOR SELECT
  USING (auth.uid() = musician_id);

DROP POLICY IF EXISTS "Hosters can read gig payments for their gigs" ON gig_payments;
CREATE POLICY "Hosters can read gig payments for their gigs"
  ON gig_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosters can insert gig payments for their gigs" ON gig_payments;
CREATE POLICY "Hosters can insert gig payments for their gigs"
  ON gig_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosters can update gig payments for their gigs" ON gig_payments;
CREATE POLICY "Hosters can update gig payments for their gigs"
  ON gig_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()
    )
  );
