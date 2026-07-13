import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { formatPay } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Gig } from '@/types';

interface GigMarkerPopupProps {
  gig: Gig;
  onPress: (gigId: string) => void;
  onClose: () => void;
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
 * GigMarkerPopup — A summary popup shown when a map marker is tapped.
 *
 * Displays the gig title, venue name, short date, and formatted pay.
 * Tapping the popup body navigates to the gig detail screen.
 * The close button dismisses the popup.
 *
 * Absolutely positioned over the map content at the bottom center.
 */
export function GigMarkerPopup({ gig, onPress, onClose }: GigMarkerPopupProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss popup"
      />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.backgroundElement },
          Platform.select({
            android: { elevation: 8 },
            default: {
              // Standard iOS shadow color — not theme-dependent
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            },
          }),
        ]}
      >
        <Pressable
          style={styles.content}
          onPress={() => onPress(gig.id)}
          accessibilityRole="button"
          accessibilityLabel={`View gig: ${gig.title}`}
        >
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {gig.title}
            </Text>
            <Text style={[styles.secondary, { color: colors.textSecondary }]} numberOfLines={1}>
              {gig.venueName}
            </Text>
            <Text style={[styles.secondary, { color: colors.textSecondary }]}>
              {formatShortDate(gig.date)}
            </Text>
          </View>
          <Text style={[styles.pay, { color: colors.text }]}>
            {formatPay(gig.pay)}
          </Text>
        </Pressable>
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close popup"
          hitSlop={8}
        >
          <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Spacing.five,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    width: '90%',
    maxWidth: 360,
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.three,
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
  pay: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
