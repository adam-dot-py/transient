import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SearchBarProps {
  location: string;
  dateRange: string;
  genre: string;
  onPress?: () => void;
}

/**
 * SearchBar — Matches the Figma "Search" component.
 *
 * A non-editable search display showing current location, date range,
 * and genre filter with separator dots. Tapping opens the search modal.
 */
export function SearchBar({ location, dateRange, genre, onPress }: SearchBarProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.backgroundElement }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Search: ${location}, ${dateRange}, ${genre}`}
    >
      <Ionicons name="search" size={24} color={colors.text} />

      <View style={styles.textContainer}>
        <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
          {location}
        </Text>
        <View style={styles.conditionRow}>
          <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
            {dateRange}
          </Text>
          <View style={[styles.dot, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
          <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
            {genre}
          </Text>
          <View style={[styles.dot, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
          <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
            Solo Artist
          </Text>
        </View>
      </View>

      <Ionicons name="options-outline" size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 12,
    gap: 12,
    height: 64,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
