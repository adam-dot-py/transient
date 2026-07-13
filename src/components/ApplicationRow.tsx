import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Application } from '@/types';

export interface ApplicationRowProps {
  application: Application;
  onPress?: (applicationId: string) => void;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a short date format.
 * Example: "2024-01-15" → "Mon, Jan 15"
 */
function formatShortDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * A row component displaying a gig application with a gradient avatar,
 * venue name, date, and trailing status badge. Used in the Activity tab.
 */
export function ApplicationRow({ application, onPress }: ApplicationRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const semanticColors = SemanticColors[colorScheme];

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.backgroundElement }]}
      onPress={() => onPress?.(application.id)}
      accessibilityRole="button"
      accessibilityLabel={`Application to ${application.venue}, ${formatShortDate(application.date)}, status ${application.status}`}
    >
      {/* Circular gradient avatar with music note */}
      <LinearGradient
        colors={[semanticColors.cardImageGradientStart, semanticColors.cardImageGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatar}
      >
        <Ionicons name="musical-notes" size={24} color="#FFFFFF" />
      </LinearGradient>

      {/* Text content: venue name and date */}
      <View style={styles.textContent}>
        <Text
          style={[styles.venueName, { color: colors.text }]}
          numberOfLines={1}
        >
          {application.venue}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatShortDate(application.date)}
        </Text>
      </View>

      {/* Trailing status badge */}
      <StatusBadge status={application.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  venueName: {
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
});
