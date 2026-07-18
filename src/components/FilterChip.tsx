import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export interface FilterChipProps {
  title: string;
  isSelected: boolean;
  onPress: () => void;
  /** Optional Ionicons icon name to show before the label */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

/**
 * FilterChip — A capsule-shaped filter pill with brand purple active state.
 * Matches the Activity screen filter button design.
 *
 * - Selected: brand purple background, white text/icon
 * - Unselected: element background with border, theme text
 */
export function FilterChip({ title, isSelected, onPress, icon }: FilterChipProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? Brand.purple : colors.backgroundElement,
          borderColor: isSelected ? Brand.purple : colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={title}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={isSelected ? '#FFFFFF' : colors.textSecondary}
        />
      )}
      <Text
        style={[
          styles.title,
          { color: isSelected ? '#FFFFFF' : colors.text },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
