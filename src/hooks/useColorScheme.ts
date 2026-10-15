import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { ThemeContext } from '@/context/ThemeContext';

/**
 * Returns the color scheme in effect for the app.
 *
 * Resolution order:
 *  1. The user's theme preference from ThemeProvider ('system' | 'light' |
 *     'dark'), already resolved to a concrete scheme. This is what lets the
 *     in-app Appearance picker flip the whole app.
 *  2. If no ThemeProvider is mounted (e.g. an isolated unit test), fall back to
 *     the device appearance, defaulting to 'dark' when unset — preserving the
 *     app's prior default.
 */
export function useColorScheme(): 'light' | 'dark' {
  // Both hooks must run unconditionally (Rules of Hooks); we then choose.
  const themeContext = useContext(ThemeContext);
  const systemScheme = useRNColorScheme();

  if (themeContext) {
    return themeContext.scheme;
  }

  // Fallback path (no provider): mirror the previous OS-only behaviour.
  return systemScheme === 'light' ? 'light' : 'dark';
}
