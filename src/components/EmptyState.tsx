import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface EmptyStateProps {
  message: string;
}

/**
 * Displays a centered message when a section has no content.
 * Uses the textSecondary theme token for subdued appearance.
 */
export function EmptyState({ message }: EmptyStateProps) {
  const color = useThemeColor({}, 'textSecondary');

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});
