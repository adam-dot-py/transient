import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Wraps React Native's useColorScheme() and defaults to 'dark'
 * when the system has no preference set or returns a non-standard value.
 */
export function useColorScheme(): 'light' | 'dark' {
  const scheme = useRNColorScheme();

  if (scheme === 'light') {
    return 'light';
  }

  return 'dark';
}
