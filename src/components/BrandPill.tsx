import { StyleSheet, Text, View } from 'react-native';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface BrandPillProps {
  /** Text label */
  label: string;
  /** Variant: 'filled' uses brand purple bg, 'outlined' uses border only */
  variant?: 'filled' | 'outlined';
  /** Size: 'small' for compact, 'default' for standard */
  size?: 'small' | 'default';
}

/**
 * BrandPill — Reusable branded pill/tag component.
 *
 * Design spec:
 * - Filled: Brand purple background, white text, rounded capsule
 * - Outlined: Transparent bg, brand purple border, purple text
 * - Small: 12px font, 4px/10px padding
 * - Default: 13px font, 6px/12px padding
 *
 * Use for genres, tags, categories, and any label that needs a pill shape.
 */
export function BrandPill({ label, variant = 'outlined', size = 'default' }: BrandPillProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const isFilled = variant === 'filled';
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.pill,
        isSmall && styles.pillSmall,
        {
          backgroundColor: isFilled ? Brand.purple : 'transparent',
          borderColor: isFilled ? Brand.purple : Brand.purple + '50',
        },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          isSmall && styles.pillTextSmall,
          { color: isFilled ? '#FFFFFF' : Brand.purple },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextSmall: {
    fontSize: 12,
  },
});
