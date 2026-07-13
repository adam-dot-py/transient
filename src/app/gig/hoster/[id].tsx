import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useGigs } from '@/context/GigContext';
import { formatPay, formatStructuredAddress } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Formats a date string (YYYY-MM-DD) into a full readable date.
 * Example: "2025-01-15" → "January 15, 2025"
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Converts HH:mm (24h) to 12-hour format with AM/PM.
 * Example: "20:00" → "8:00 PM"
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Formats start and end time into a time range string.
 * Example: "20:00", "23:00" → "8:00 PM – 11:00 PM"
 */
function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

export default function HosterGigDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getGigById } = useGigs();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const gig = getGigById(id);

  if (!gig) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>
            Gig not found
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: colors.text }]}>{gig.title}</Text>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Venue
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {gig.venueName}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Address
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {formatStructuredAddress(gig)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Date
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {formatDate(gig.date)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Time
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {formatTimeRange(gig.startTime, gig.endTime)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Genre
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {gig.genres.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Pay
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {formatPay(gig.pay)}
          </Text>
        </View>

        {gig.description ? (
          <View style={styles.descriptionSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Description
            </Text>
            <Text style={[styles.description, { color: colors.text }]}>
              {gig.description}
            </Text>
          </View>
        ) : null}

        <View style={styles.musiciansSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Musicians Accepted
          </Text>
          {gig.acceptedMusicianIds.length > 0 ? (
            gig.acceptedMusicianIds.map((musicianId) => (
              <View
                key={musicianId}
                style={[
                  styles.musicianItem,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <Text style={[styles.musicianText, { color: colors.text }]}>
                  {musicianId}
                </Text>
              </View>
            ))
          ) : (
            <Text
              style={[styles.emptyMusicians, { color: colors.textSecondary }]}
            >
              No musicians accepted yet
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Intentional accent colors: The theme tokens don't include primary/accent colors,
// so these hardcoded values are used deliberately for semantic meaning:
// - #2E7D32 (green): primary action buttons
// - #FFFFFF (white): text on accent-colored backgrounds
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.four,
  },
  detailRow: {
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: Spacing.one,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 17,
  },
  descriptionSection: {
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  musiciansSection: {
    marginTop: Spacing.five,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.three,
  },
  musicianItem: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    marginBottom: Spacing.two,
  },
  musicianText: {
    fontSize: 15,
  },
  emptyMusicians: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: Spacing.four,
  },
  backButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
