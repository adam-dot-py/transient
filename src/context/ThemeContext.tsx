import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Appearance } from 'react-native';

import { STORAGE_KEYS } from '@/types';

/**
 * User-facing theme preference.
 *  - 'system' follows the device appearance (the common default).
 *  - 'light' / 'dark' force a scheme regardless of the device.
 */
export type ThemeMode = 'system' | 'light' | 'dark';

/** The concrete scheme actually used to pick colors. */
export type ResolvedScheme = 'light' | 'dark';

interface ThemeContextValue {
  /** The user's stored preference. */
  mode: ThemeMode;
  /** The scheme in effect right now (system preference already resolved). */
  scheme: ResolvedScheme;
  /** Persist a new preference. */
  setMode: (mode: ThemeMode) => void;
  /** True until the persisted preference has loaded. */
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** Resolve a preference + the current OS appearance into a concrete scheme. */
function resolveScheme(
  mode: ThemeMode,
  system: ResolvedScheme,
): ResolvedScheme {
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }
  return system;
}

/**
 * Owns the app's theme preference and exposes the resolved scheme.
 *
 * Common-practice design:
 *  - Three-way preference ('system' default), persisted to AsyncStorage so it
 *    survives restarts — mirrors the existing RoleContext pattern.
 *  - When 'system', it tracks live OS appearance changes via Appearance so the
 *    app re-themes the instant the device toggles, without a reload.
 *  - All color consumers read the RESOLVED scheme through useColorScheme(), so
 *    forcing light/dark here flips the whole app with zero per-screen changes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ResolvedScheme>(
    Appearance.getColorScheme() === 'light' ? 'light' : 'dark',
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load the persisted preference once.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
        if (mounted && isThemeMode(saved)) {
          setModeState(saved);
        }
      } catch {
        // Fail-safe: keep 'system' on any storage error.
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Track live OS appearance changes (only matters while mode === 'system').
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'light' ? 'light' : 'dark');
    });
    return () => sub.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    // Fire-and-forget; a failed persist is non-critical.
    AsyncStorage.setItem(STORAGE_KEYS.THEME, next).catch(() => {});
  }, []);

  const scheme = resolveScheme(mode, systemScheme);

  return (
    <ThemeContext.Provider value={{ mode, scheme, setMode, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeContext };
