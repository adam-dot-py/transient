# Supabase Configuration Report: Gig Invoices

This is the standalone setup report you asked for. It lists exactly what you need to configure in Supabase so the Gig Invoices feature works against a live backend. The app ships mock-first (the Supabase client returns `null` and the feature runs against `src/data/mockGigPayments.ts`), so none of the steps below are required for local development. They are required only when you point the app at a real Supabase project.

`BACKEND_SETUP.md` is gitignored and is not present in the working tree, so **this report is the authoritative setup record for this feature**. Please fold the steps below into your private `BACKEND_SETUP.md`.

## Summary checklist

- [ ] 1. Apply migration `src/supabase/migrations/0003_gig_payments.sql` (after `0001_gig_search_postgis.sql` and `0002_amplify_recipients.sql`).
- [ ] 2. Verify the `gig_payments` table schema matches this report.
- [ ] 3. Verify the three indexes exist.
- [ ] 4. Verify the four RLS policies exist with the expressions below and that RLS is enabled.
- [ ] 5. Confirm nothing else is needed: no new RPC, storage bucket, Edge Function, or secret.
- [ ] 6. Record these steps in your private `BACKEND_SETUP.md`.
- [ ] 7. Note the "How to mark a gig as paid" precondition that unlocks invoice export.

## 1. Apply the migration

Run the migration in the Supabase SQL editor (or through your migration pipeline), in order, after the earlier migrations:

| Order | File                                                  |
| ----- | ----------------------------------------------------- |
| 1     | `src/supabase/migrations/0001_gig_search_postgis.sql` |
| 2     | `src/supabase/migrations/0002_amplify_recipients.sql` |
| 3     | **`src/supabase/migrations/0003_gig_payments.sql`**   |

The migration is additive and idempotent (it uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE UNIQUE INDEX IF NOT EXISTS`, and `DROP POLICY IF EXISTS` before each `CREATE POLICY`), so it is safe to re-run. It also runs `CREATE EXTENSION IF NOT EXISTS "pgcrypto"` as a standalone guard. The same definition is consolidated into `src/supabase/schema.sql` as the current-state reference; you only need to apply the migration.

## 2. Resulting `gig_payments` table schema

One row per `(gig, accepted musician)` payout. A musician payout is distinct from `amplify_payments` (which records a hoster's Amplify boost purchase). Amounts are stored in PENCE (the app speaks whole pounds; conversion happens at the service boundary).

| Column           | Type          | Constraints / Default                                                  |
| ---------------- | ------------- | ---------------------------------------------------------------------- |
| `id`             | `uuid`        | PRIMARY KEY, DEFAULT `gen_random_uuid()`                               |
| `gig_id`         | `uuid`        | NOT NULL, REFERENCES `gigs(id)` ON DELETE CASCADE                      |
| `musician_id`    | `uuid`        | NOT NULL, REFERENCES `profiles(id)` ON DELETE CASCADE                  |
| `amount_pence`   | `integer`     | NOT NULL, CHECK (`amount_pence` BETWEEN 1 AND 9999900)                 |
| `currency`       | `text`        | NOT NULL, DEFAULT `'gbp'`                                              |
| `status`         | `text`        | NOT NULL, DEFAULT `'pending'`, CHECK (`status` IN ('pending', 'paid')) |
| `invoice_number` | `text`        | NULLABLE                                                               |
| `paid_at`        | `timestamptz` | NULLABLE                                                               |
| `created_at`     | `timestamptz` | NOT NULL, DEFAULT `now()`                                              |
| `updated_at`     | `timestamptz` | NOT NULL, DEFAULT `now()`                                              |

**Unique constraint:** `uq_gig_payment_gig_musician` on `(gig_id, musician_id)` — one payout per musician per gig.

**Trigger:** `gig_payments_updated_at` BEFORE UPDATE, executing the shared `update_updated_at_column()` helper (defined in `schema.sql`), to keep `updated_at` current.

## 3. Indexes created

| Index                            | Definition                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `idx_gig_payments_musician_id`   | `CREATE INDEX ... ON gig_payments(musician_id)`                                            |
| `idx_gig_payments_gig_id`        | `CREATE INDEX ... ON gig_payments(gig_id)`                                                 |
| `uq_gig_payments_invoice_number` | `CREATE UNIQUE INDEX ... ON gig_payments(invoice_number) WHERE invoice_number IS NOT NULL` |

The partial unique index means an invoice number, once assigned, is globally unique, while the many uninvoiced rows (`invoice_number IS NULL`) do not collide.

## 4. Row-Level Security

RLS is enabled in the same migration:

```sql
ALTER TABLE gig_payments ENABLE ROW LEVEL SECURITY;
```

Four policies are defined:

| Policy name                                      | Command | Expression                                                                                                                                                                                         |
| ------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Musicians can read own gig payments`            | SELECT  | `USING (auth.uid() = musician_id)`                                                                                                                                                                 |
| `Hosters can read gig payments for their gigs`   | SELECT  | `USING (EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()))`                                                                                                       |
| `Hosters can insert gig payments for their gigs` | INSERT  | `WITH CHECK (EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()))`                                                                                                  |
| `Hosters can update gig payments for their gigs` | UPDATE  | `USING (EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()))` and `WITH CHECK (EXISTS (SELECT 1 FROM gigs WHERE gigs.id = gig_id AND gigs.hoster_id = auth.uid()))` |

### Access model in plain English

- A musician can read **only their own** payment rows (`auth.uid() = musician_id`). This is what lets a musician read the payment that backs their invoice. A musician can never read another musician's earnings.
- A musician is intentionally granted **no INSERT and no UPDATE**. Musicians only read their payments to generate invoices.
- Only the gig's **hoster** can create and update payment rows, and only for gigs they own (the gig's `hoster_id` equals the caller). The hoster is the party that actually pays the musician, so the hoster owns writes. This mirrors the ownership check used by the `applications` and `example_songs` policies.

## 4a. Additive `gigs.image_url` column (migration `0004_gig_image.sql`)

A later change lets a hoster optionally attach an image to a gig (the gig
detail hero card and gig cards fall back to the existing gradient placeholder
when none is set). This is an additive, idempotent migration on the existing
`gigs` table — apply it after `0003_gig_payments.sql`:

| Order | File                                                |
| ----- | --------------------------------------------------- |
| 4     | **`src/supabase/migrations/0004_gig_image.sql`**    |

| Column      | Type   | Constraints / Default                                  |
| ----------- | ------ | ------------------------------------------------------ |
| `image_url` | `text` | NULLABLE (`ALTER TABLE gigs ADD COLUMN IF NOT EXISTS`) |

- **Nullable:** `image_url` is optional. When it is `NULL` the app renders the
  gradient placeholder; when set, the uploaded image is shown. The same column
  is consolidated into `src/supabase/schema.sql`.
- **No new RLS:** the column lives on the existing `gigs` row, so the existing
  `gigs` policies (public SELECT of gigs; hoster-only INSERT/UPDATE of their own
  gigs) already govern who can read and write it. No new policy is needed.
- **Storage for live use:** for a live backend, gig images would be uploaded to
  a Supabase Storage bucket (e.g. a `gig-images` bucket) and `image_url` would
  hold the object path / public URL. **No bucket is created by this feature** —
  the mock dev loop uses a local-uri picker (`src/components/GigImagePicker.tsx`,
  mirroring `AvatarUploader`) so no bucket is required for local development.
  Provision the bucket when wiring up a real image upload pipeline.

## 5. Nothing else is required

| Backend item                  | Required for this feature?                                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| New RPC / Postgres function   | No. The only query is a direct indexed lookup by `(gig_id, musician_id)` that RLS constrains; there is no proximity or aggregation to push into SQL. |
| Storage bucket                | No. The PDF is generated on-device by expo-print and shared via expo-sharing; nothing is uploaded.                                                   |
| Edge Function                 | No.                                                                                                                                                  |
| Secret / environment variable | No new secret. The feature only needs the existing `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` that the app already uses.           |
| PostGIS / spatial column      | No. There is no location logic in this feature.                                                                                                      |

## 6. How to mark a gig as paid (the precondition that unlocks invoice export)

Invoice export is gated on eligibility: the musician must be **accepted** for the gig (their application is `accepted` and their id is in the gig's `accepted_musician_ids`) **and** a `gig_payments` row must exist for them with `status = 'paid'`. Until the payment is marked paid, the export control is shown disabled with a reason.

To unlock export for an accepted musician:

1. **Create the payout row** (if it does not already exist), owned by the gig's hoster:

   ```sql
   insert into gig_payments (gig_id, musician_id, amount_pence, currency, status)
   values ('<gig-id>', '<musician-id>', <pay-in-pence>, 'gbp', 'pending');
   ```

   `amount_pence` is the pay in pence, e.g. 225 GBP is `22500`.

2. **Mark it paid** when the money has actually been sent:

   ```sql
   update gig_payments
      set status = 'paid',
          paid_at = now()
    where gig_id = '<gig-id>'
      and musician_id = '<musician-id>';
   ```

Once `status = 'paid'`, the accepted musician sees an enabled "Export PDF invoice" control on the gig detail screen and can export the invoice. `invoice_number` can be left NULL; the app generates a deterministic number (`INV-YYYYMMDD-<short>`) if none is stored.

## 7. Action for the maintainer

Because `BACKEND_SETUP.md` is gitignored and not committed, copy sections 1 through 6 of this report into your private `BACKEND_SETUP.md` so the migration, schema, indexes, RLS policies, and the "mark as paid" operational note are captured in your canonical setup guide.
