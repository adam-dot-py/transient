import { Pressable, StyleSheet, Text, useColorScheme } from 'react-native';

import { Colors, SemanticColors } from '@/constants/theme';

export interface FilterChipProps {
  title: string;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * A capsule-shaped filter pill used for time-based gig filtering.
 * Matches the Figma "Gig Filters" section:
 * - Selected: red accent background (#FF0040 at 90% opacity), white text
 * - Unselected: white background with #E6E6E6 border, dark text
 */
export function FilterChip({ title, isSelected, onPress }: FilterChipProps) {
  const rawScheme = useColorScheme();
  const scheme: 'light' | 'dark' = rawScheme === 'light' ? 'light' : 'dark';
  const colors = Colors[scheme];
  const semantic = SemanticColors[scheme];

  const backgroundColor = isSelected ? semantic.accentRed : colors.background;
  const borderColor = isSelected ? 'transparent' : colors.border;
  const textColor = isSelected ? '#FFFFFF' : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor, borderColor }]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.title, { color: textColor }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
