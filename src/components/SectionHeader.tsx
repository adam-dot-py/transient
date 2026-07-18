import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export interface SectionHeaderProps {
  title: string;
  actionTitle?: string;
  onAction?: () => void;
}

/**
 * Section header with title and optional trailing action button.
 * Uses brand cyan for the action link.
 */
export function SectionHeader({ title, actionTitle, onAction }: SectionHeaderProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {actionTitle && (
        <Pressable
          style={styles.actionButton}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionTitle}
        >
          <Text style={[styles.actionText, { color: Brand.blue }]}>{actionTitle}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  actionButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
