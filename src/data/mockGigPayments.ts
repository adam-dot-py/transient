/**
 * Mock gig payment data for local development.
 *
 * These stand in for rows of the Supabase `gig_payments` table while the app
 * runs in mock-first mode (supabase === null). They are tied to real mock gigs
 * (see src/data/mockGigs.ts) and the current user (musician-1, see
 * src/data/mockProfiles.ts) so the invoice dev loop has data to work with:
 *
 *   * A 'paid' payment for gig-9 (a past gig CURRENT_USER was accepted for) so
 *     the "export invoice" happy path can be demonstrated end to end.
 *   * A 'pending' payment for gig-5 (an accepted gig CURRENT_USER is on) so the
 *     blocked path (payment exists but not yet paid) can be exercised.
 *
 * Amounts are in PENCE and mirror the gig's whole-pound `pay` value
 * (gig-9.pay = 225 => 22500; gig-5.pay = 200 => 20000).
 */

import type { GigPayment } from '@/types';

export const MOCK_GIG_PAYMENTS: GigPayment[] = [
  {
    // gig-9 "Last Month's Rock Night" — past gig, musician-1 accepted + paid.
    id: 'gig-payment-1',
    gigId: 'gig-9',
    musicianId: 'musician-1',
    amountPence: 22500, // gig-9.pay = £225
    currency: 'gbp',
    status: 'paid',
    invoiceNumber: null,
    paidAt: '2024-01-15T18:30:00.000Z',
    createdAt: '2024-01-15T18:00:00.000Z',
  },
  {
    // gig-5 "Blues on Broadway" — accepted gig, musician-1 on it, not yet paid.
    id: 'gig-payment-2',
    gigId: 'gig-5',
    musicianId: 'musician-1',
    amountPence: 20000, // gig-5.pay = £200
    currency: 'gbp',
    status: 'pending',
    invoiceNumber: null,
    paidAt: null,
    createdAt: '2024-02-01T09:00:00.000Z',
  },
];
