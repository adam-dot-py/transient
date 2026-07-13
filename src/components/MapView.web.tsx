import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { formatPay } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Gig, MapRegion } from '@/types';

export interface AppMapViewProps {
  gigs: Gig[];
  initialRegion: MapRegion;
  onMarkerPress: (gig: Gig) => void;
}

/**
 * Formats a date string (YYYY-MM-DD) into a short human-readable format.
 * Example: "2025-01-15" → "Wed, Jan 15"
 */
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * AppMapView (Web fallback) — Shows an unavailable message and a scrollable
 * list of gigs as a fallback since react-native-maps does not support web.
 *
 * Each list item displays the gig title, venue, date, and pay. Pressing an
 * item calls `onMarkerPress` with the corresponding gig object.
 */
export function AppMapView({ gigs, onMarkerPress }: AppMapViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.unavailable, { color: colors.textSecondary }]}>
        Map view is not available on web
      </Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {gigs.map((gig) => (
          <Pressable
            key={gig.id}
            style={[styles.item, { backgroundColor: colors.backgroundElement }]}
            onPress={() => onMarkerPress(gig)}
            accessibilityRole="button"
            accessibilityLabel={`View gig: ${gig.title}`}
          >
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {gig.title}
            </Text>
            <Text style={[styles.secondary, { color: colors.textSecondary }]}>
              {gig.venueName}
            </Text>
            <View style={styles.row}>
              <Text style={[styles.secondary, { color: colors.textSecondary }]}>
                {formatShortDate(gig.date)}
              </Text>
              <Text style={[styles.pay, { color: colors.text }]}>
                {formatPay(gig.pay)}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  unavailable: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  item: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  secondary: {
    fontSize: 14,
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  pay: {
    fontSize: 16,
    fontWeight: '700',
  },
});
