/**
 * Stripe payment service for the Amplify feature.
 *
 * ─── Architecture ────────────────────────────────────────────────────────────
 * 1. Client calls createAmplifyPaymentIntent() → hits Supabase Edge Function
 * 2. Edge Function creates a Stripe PaymentIntent (£1.79) → returns clientSecret
 * 3. Client passes clientSecret to @stripe/stripe-react-native initPaymentSheet()
 * 4. User confirms payment via native Stripe sheet
 * 5. On success, client calls recordAmplifyPayment() to persist the record
 * 6. Gig is created and pushed to musicians within the selected radius
 *
 * ─── Backend Contract (Supabase Edge Functions) ──────────────────────────────
 *
 * POST /functions/v1/create-amplify-payment-intent
 *   Headers: { Authorization: Bearer <supabase_jwt>, Content-Type: application/json }
 *   Body:    { amount: 179, currency: "gbp", radius: number }
 *   Returns: { clientSecret: string, paymentIntentId: string, ephemeralKey: string, customer: string }
 *
 * POST /functions/v1/record-amplify-payment
 *   Headers: { Authorization: Bearer <supabase_jwt>, Content-Type: application/json }
 *   Body:    { paymentIntentId: string, gigId: string, radius: number }
 *   Returns: { success: boolean }
 *
 * ─── Development Mode ────────────────────────────────────────────────────────
 * When EXPO_PUBLIC_SUPABASE_URL is not set, all functions return mock data
 * so the front end flow can be tested without a running backend.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '@/supabase/client';

/**
 * Minimal structural view of the Supabase client's Edge Functions API.
 *
 * `supabase` from the client module is typed as `null` until the real
 * @supabase/supabase-js client is wired in (see client.ts). After the runtime
 * `if (!supabase)` guard, TypeScript narrows the remaining type to `never`,
 * which is why `supabase.functions` errored. We narrow through this structural
 * type at each call site so the Edge Function calls type-check without the
 * package being installed yet. Mirrors the RPC-client narrowing in
 * `src/data/searchService.ts`.
 */
interface SupabaseFunctionsClient {
  functions: {
    invoke(
      name: string,
      options?: { body?: unknown }
    ): Promise<{ data: unknown; error: { message?: string } | null }>;
  };
}

// ─── Config ──────────────────────────────────────────────────────────────────

export const AMPLIFY_CONFIG = {
  /** Displayed price string */
  priceDisplay: '£1.79',
  /** Amount in pence (for Stripe, which uses smallest currency unit) */
  pricePence: 179,
  /** ISO currency code */
  currency: 'gbp',
  /** Available radius options in miles */
  radiusOptions: [5, 10, 15, 25] as const,
} as const;

export type AmplifyRadius = (typeof AMPLIFY_CONFIG.radiusOptions)[number];

// ─── Response Types ──────────────────────────────────────────────────────────

export interface PaymentSheetParams {
  clientSecret: string;
  paymentIntentId: string;
  ephemeralKey: string;
  customer: string;
}

// ─── Service Functions ───────────────────────────────────────────────────────

/**
 * Creates a Stripe PaymentIntent via the Supabase Edge Function.
 * Returns the params needed to initialise @stripe/stripe-react-native's payment sheet.
 */
export async function createAmplifyPaymentIntent(
  radius: AmplifyRadius
): Promise<PaymentSheetParams> {
  if (!supabase) {
    // Mock for development — simulates a 500ms network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`,
      paymentIntentId: `pi_mock_${Date.now()}`,
      ephemeralKey: `ek_mock_${Date.now()}`,
      customer: `cus_mock_${Date.now()}`,
    };
  }

  const client = supabase as unknown as SupabaseFunctionsClient;
  const { data, error } = await client.functions.invoke(
    'create-amplify-payment-intent',
    {
      body: {
        amount: AMPLIFY_CONFIG.pricePence,
        currency: AMPLIFY_CONFIG.currency,
        radius,
      },
    }
  );

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create payment intent');
  }

  return data as PaymentSheetParams;
}

/**
 * Records a successful Amplify payment in the amplify_payments table.
 * Called after Stripe confirms the payment on the client side.
 */
export async function recordAmplifyPayment(params: {
  paymentIntentId: string;
  gigId: string;
  radius: AmplifyRadius;
}): Promise<void> {
  if (!supabase) {
    // Mock: log for development
    console.log('[Amplify] Payment recorded:', params.paymentIntentId, 'for gig:', params.gigId);
    return;
  }

  const client = supabase as unknown as SupabaseFunctionsClient;
  const { error } = await client.functions.invoke('record-amplify-payment', {
    body: params,
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to record payment');
  }
}
