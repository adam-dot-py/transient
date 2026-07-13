import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, SemanticColors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export interface SectionHeaderProps {
  title: string;
  actionTitle?: string;
  onAction?: () => void;
}

/**
 * Section header with title and optional trailing action button.
 * Used above carousels and list sections to label content groups.
 */
export function SectionHeader({ title, actionTitle, onAction }: SectionHeaderProps) {
  const scheme = useColorScheme();
  const textColor = Colors[scheme].text;
  const actionColor = SemanticColors[scheme].actionBlue;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {actionTitle && (
        <Pressable
          style={styles.actionButton}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionTitle}
        >
          <Text style={[styles.actionText, { color: actionColor }]}>{actionTitle}</Text>
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
  },
});
