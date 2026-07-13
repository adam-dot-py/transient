import { Pressable, StyleSheet, Text } from 'react-native';

import { SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MapPriceChipProps {
  price: string;
  isSelected?: boolean;
  onPress?: () => void;
}

/**
 * MapPriceChip — Price indicator shown on the map.
 *
 * Matches the Figma "Chip" elements on the Explore map.
 * - Default: white/light background with dark text, subtle shadow
 * - Selected: dark background with white text
 */
export function MapPriceChip({ price, isSelected = false, onPress }: MapPriceChipProps) {
  const scheme = useColorScheme();
  const semantic = SemanticColors[scheme];

  const backgroundColor = isSelected
    ? semantic.mapChipActiveBackground
    : semantic.mapChipBackground;

  const textColor = isSelected ? '#FFFFFF' : '#1B2228';

  return (
    <Pressable
      style={[
        styles.chip,
        { backgroundColor },
        !isSelected && styles.chipShadow,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Gig at ${price}`}
    >
      <Text style={[styles.text, { color: textColor }]}>{price}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipShadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
