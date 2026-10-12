import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SearchBarProps {
  location: string;
  dateRange: string;
  genre: string;
  onPress?: () => void;
  /**
   * When provided, the bar becomes an editable text search driving the query.
   * `value` reflects the current query; `onChangeText` writes it back.
   */
  value?: string;
  onChangeText?: (text: string) => void;
  /** Placeholder for the editable variant. */
  placeholder?: string;
  /** Called when the trailing options icon is pressed (e.g. open filters). */
  onOptionsPress?: () => void;
  /** Called when the location label is pressed (opens the location picker). */
  onLocationPress?: () => void;
}

/**
 * SearchBar — Matches the Figma "Search" component.
 *
 * Two modes:
 * - Display (default): a non-editable summary of location / date / genre.
 *   Tapping fires `onPress`.
 * - Editable: when `onChangeText` is provided, renders a `TextInput` bound to
 *   `value` so the top bar directly drives the search query.
 */
export function SearchBar({
  location,
  dateRange,
  genre,
  onPress,
  value,
  onChangeText,
  placeholder = 'Search gigs, venues, cities',
  onOptionsPress,
  onLocationPress,
}: SearchBarProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const editable = typeof onChangeText === 'function';

  if (editable) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.backgroundElement }]}
      >
        <Ionicons name="search" size={24} color={colors.text} />
        <View style={styles.textContainer}>
          <Pressable
            onPress={onLocationPress}
            accessibilityRole="button"
            accessibilityLabel={`Change location, currently ${location}`}
            style={styles.locationRow}
            hitSlop={6}
          >
            <Ionicons name="location-outline" size={14} color={colors.text} />
            <Text
              style={[styles.locationText, { color: colors.text }]}
              numberOfLines={1}
            >
              {location}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </Pressable>
          <TextInput
            style={[styles.input, { color: colors.textSecondary }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search gigs"
          />
        </View>
        <Pressable
          onPress={onOptionsPress}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          hitSlop={8}
        >
          <Ionicons name="options-outline" size={24} color={colors.text} />
        </Pressable>
      </View>
    );
  }

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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    fontSize: 14,
    lineHeight: 22,
    padding: 0,
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
