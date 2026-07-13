import { StyleSheet, Text, View } from 'react-native';

import type { ApplicationStatus } from '@/types';

/**
 * Returns the background color for a given application status.
 *
 * - pending → orange (#FF9500)
 * - accepted → green (#34C759)
 * - declined → red (#FF3B30)
 * - unexpected values → neutral gray (#8E8E93)
 */
export function getStatusColor(status: ApplicationStatus): string {
  const colorMap: Record<ApplicationStatus, string> = {
    pending: '#FF9500',
    accepted: '#34C759',
    declined: '#FF3B30',
  };
  return colorMap[status] ?? '#8E8E93';
}

export interface StatusBadgeProps {
  status: ApplicationStatus;
}

/**
 * A capsule-shaped colored badge displaying application status text.
 * Renders the status in capitalized form (first letter uppercase, rest lowercase)
 * with a colored background corresponding to the status value.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) {
    return null;
  }

  const backgroundColor = getStatusColor(status);
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
