/**
 * Supabase Client Configuration
 *
 * This module initialises the Supabase client with typed generics and
 * environment-based configuration. It is designed to be mock-friendly:
 * during development the app uses local mock data, so the client is only
 * instantiated when real credentials are provided.
 *
 * ─── Mock-First Development Approach ─────────────────────────────────────────
 * In development, service modules read from local mock data files (src/data/mock*.ts).
 * The Supabase client is NOT required for local development. It activates only when
 * SUPABASE_URL and SUPABASE_ANON_KEY environment variables are set (test/production).
 * This keeps the dev loop fast and offline-capable.
 *
 * ─── Installation ────────────────────────────────────────────────────────────
 * The @supabase/supabase-js package must be installed before this client can be
 * used at runtime:
 *
 *   npm install @supabase/supabase-js
 *
 * Until then, this file compiles cleanly as a type-safe module and exports null
 * when credentials are missing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Database } from '@/supabase/types';

// ─── Environment Variables ───────────────────────────────────────────────────

/**
 * Supabase project URL and anonymous key are read from environment variables.
 *
 * In Expo, environment variables can be provided via:
 *  - app.json `extra` field (accessed via expo-constants)
 *  - EAS build secrets
 *  - .env file with EXPO_PUBLIC_ prefix (Expo SDK 49+)
 *
 * We check process.env first (for EXPO_PUBLIC_ convention), then fall back to
 * expo-constants `expoConfig.extra` for EAS-based builds.
 */
function getSupabaseConfig(): { url: string; anonKey: string } | null {
  // Expo public env vars (preferred — works with .env files)
  const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  // Fallback: expo-constants (for app.json extra or EAS secrets)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default;
    const extra = Constants?.expoConfig?.extra;
    if (extra?.supabaseUrl && extra?.supabaseAnonKey) {
      return { url: extra.supabaseUrl, anonKey: extra.supabaseAnonKey };
    }
  } catch {
    // expo-constants not available (e.g. in test environment) — that's fine
  }

  return null;
}

// ─── Client Creation ─────────────────────────────────────────────────────────

/**
 * Creates a typed Supabase client instance.
 *
 * Returns null when credentials are not configured (local development).
 * Consumers should check for null before making Supabase calls:
 *
 * ```ts
 * import { supabase } from '@/supabase/client';
 *
 * if (supabase) {
 *   const { data } = await supabase.from('profiles').select('*');
 * }
 * ```
 */
function createClient() {
  const config = getSupabaseConfig();

  if (!config) {
    // No credentials — running in mock/development mode
    return null;
  }

  // Dynamic import to avoid hard failure when @supabase/supabase-js isn't installed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

  return createSupabaseClient<Database>(config.url, config.anonKey, {
    auth: {
      // Use AsyncStorage for persisting auth sessions across app restarts
      // storage: AsyncStorage, // Uncomment when @react-native-async-storage is configured for Supabase
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Disable for React Native (handled via deep links)
    },
  });
}

// ─── Exported Client ─────────────────────────────────────────────────────────

/**
 * The Supabase client instance, typed with the Database schema.
 *
 * Will be `null` in development mode (no credentials configured).
 * Service modules should use mock data when this is null.
 */
export const supabase = createClient();

/**
 * Type-safe helper to check if Supabase is available.
 * Useful for conditional logic in service modules.
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
