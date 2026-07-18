import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ScreenBackgroundProps {
  children: React.ReactNode;
}

/**
 * ScreenBackground — Wraps screen content with the appropriate
 * background color based on light/dark mode. Clean and minimal.
 *
 * Light mode: white background
 * Dark mode: deep navy background
 *
 * Brand colors are used as accents (buttons, borders, links)
 * rather than dominating the background.
 */
export function ScreenBackground({ children }: ScreenBackgroundProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
