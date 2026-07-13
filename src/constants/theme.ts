import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F5F5F5',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#828282',
    border: '#E6E6E6',
    cardBackground: '#FCFEFF',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    border: '#333333',
    cardBackground: '#1A1A1A',
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
    actionBlue: '#38B5D7',
    accentRed: 'rgba(255, 0, 64, 0.9)',
    actionBlack: '#1B2228',
    gradientStart: 'rgba(0, 122, 255, 0.1)',
    gradientEnd: 'rgba(175, 82, 222, 0.1)',
    cardImageGradientStart: 'rgba(0, 122, 255, 0.3)',
    cardImageGradientEnd: 'rgba(175, 82, 222, 0.3)',
    ultraThinMaterial: 'rgba(255, 255, 255, 0.6)',
    locationOverlay: 'rgba(29, 29, 29, 0.4)',
    mapChipBackground: '#FCFEFF',
    mapChipActiveBackground: 'rgba(0, 0, 0, 0.9)',
  },
  dark: {
    favorite: '#FF3B30',
    statusPending: '#FF9500',
    statusAccepted: '#34C759',
    statusDeclined: '#FF3B30',
    paymentGreen: '#34C759',
    actionBlue: '#38B5D7',
    accentRed: 'rgba(255, 0, 64, 0.9)',
    actionBlack: '#1B2228',
    gradientStart: 'rgba(0, 122, 255, 0.15)',
    gradientEnd: 'rgba(175, 82, 222, 0.15)',
    cardImageGradientStart: 'rgba(0, 122, 255, 0.4)',
    cardImageGradientEnd: 'rgba(175, 82, 222, 0.4)',
    ultraThinMaterial: 'rgba(0, 0, 0, 0.6)',
    locationOverlay: 'rgba(29, 29, 29, 0.6)',
    mapChipBackground: '#2E3135',
    mapChipActiveBackground: 'rgba(255, 255, 255, 0.9)',
  },
} as const;

export type SemanticColor = keyof typeof SemanticColors.light & keyof typeof SemanticColors.dark;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
