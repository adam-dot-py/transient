import { Platform } from 'react-native';

// ─── Brand Palette ───────────────────────────────────────────────────────────
// Extracted from the Transient logo. The primary gradient flows from
// purple (bottom-left) through blue to cyan (top-right).
export const Brand = {
  /** Primary gradient stops (use with LinearGradient) */
  gradient: ['#7C3AED', '#2563EB', '#06B6D4'] as const,
  /** Purple (logo stem/base) */
  purple: '#7C3AED',
  /** Blue (logo mid-tone) */
  blue: '#2563EB',
  /** Cyan (logo highlight/top) */
  cyan: '#06B6D4',
  /** Magenta accent (tagline underline) */
  magenta: '#D946EF',
  /** Dark navy (wordmark text color) */
  navy: '#1A1A2E',
  /** Lighter purple for secondary use */
  purpleLight: '#A78BFA',
  /** Amplify gradient (used on the Amplify pill) */
  amplifyGradient: ['#6366F1', '#8B5CF6', '#D946EF'] as const,
} as const;

export const Colors = {
  light: {
    text: '#1A1A2E',
    background: '#F9F8FC',
    backgroundElement: '#F1F0F6',
    backgroundSelected: '#EEECF5',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    cardBackground: '#FFFFFF',
  },
  dark: {
    text: '#F9FAFB',
    background: '#0F0F1A',
    backgroundElement: '#1C1C2E',
    backgroundSelected: '#2A2A3E',
    textSecondary: '#9CA3AF',
    border: '#2E2E42',
    cardBackground: '#161625',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const SemanticColors = {
  light: {
    favorite: '#FF3B30',
    statusPending: '#FF9500',
    statusAccepted: '#34C759',
    statusDeclined: '#FF3B30',
    paymentGreen: '#34C759',
    actionBlue: '#2563EB',
    accentRed: 'rgba(255, 0, 64, 0.9)',
    actionBlack: '#1A1A2E',
    gradientStart: 'rgba(124, 58, 237, 0.1)',
    gradientEnd: 'rgba(6, 182, 212, 0.1)',
    cardImageGradientStart: 'rgba(124, 58, 237, 0.3)',
    cardImageGradientEnd: 'rgba(6, 182, 212, 0.3)',
    ultraThinMaterial: 'rgba(255, 255, 255, 0.6)',
    locationOverlay: 'rgba(26, 26, 46, 0.4)',
    mapChipBackground: '#FCFEFF',
    mapChipActiveBackground: 'rgba(26, 26, 46, 0.9)',
  },
  dark: {
    favorite: '#FF3B30',
    statusPending: '#FF9500',
    statusAccepted: '#34C759',
    statusDeclined: '#FF3B30',
    paymentGreen: '#34C759',
    actionBlue: '#38B5D7',
    accentRed: 'rgba(255, 0, 64, 0.9)',
    actionBlack: '#1A1A2E',
    gradientStart: 'rgba(124, 58, 237, 0.15)',
    gradientEnd: 'rgba(6, 182, 212, 0.15)',
    cardImageGradientStart: 'rgba(124, 58, 237, 0.4)',
    cardImageGradientEnd: 'rgba(6, 182, 212, 0.4)',
    ultraThinMaterial: 'rgba(10, 10, 15, 0.6)',
    locationOverlay: 'rgba(26, 26, 46, 0.6)',
    mapChipBackground: '#1A1A2E',
    mapChipActiveBackground: 'rgba(255, 255, 255, 0.9)',
  },
} as const;

export type SemanticColor = keyof typeof SemanticColors.light & keyof typeof SemanticColors.dark;

export const BottomTabInset = Platform.select({ ios: 96, android: 96 }) ?? 96;
export const MaxContentWidth = 800;
