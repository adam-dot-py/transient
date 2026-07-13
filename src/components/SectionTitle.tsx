import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SectionTitleProps {
  sectionName: string;
  /** @deprecated Profile is now accessible via the tab bar */
  onProfilePress?: () => void;
}

/**
 * SectionTitle — Large bold section heading.
 *
 * Matches the Figma "Home" text element at the top of the Home Page.
 * Simple, left-aligned heading with 24px semi-bold text and -0.02em letter spacing.
 */
export function SectionTitle({ sectionName }: SectionTitleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {sectionName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.48,
    lineHeight: 34,
  },
});
