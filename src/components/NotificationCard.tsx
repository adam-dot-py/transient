import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, SemanticColors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Notification } from '@/types';

export interface NotificationCardProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
}

/**
 * NotificationCard — a list item for displaying a push notification.
 *
 * Shows a type-appropriate icon (bell for new_gig, checkmark-circle for
 * approved, close-circle for declined), title, body, relative timestamp,
 * and a read/unread visual indicator (bold text + accent left border when unread).
 */
export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const semantic = SemanticColors[colorScheme];

  const iconProps = getIconForType(notification.type, semantic);
  const timeLabel = formatRelativeTime(notification.createdAt);

  const card = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.backgroundElement, borderColor: colors.border },
        !notification.read && { borderLeftColor: semantic.actionBlue, borderLeftWidth: 3 },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${notification.read ? '' : 'Unread '}notification: ${notification.title}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconProps.bgColor }]}>
        <Ionicons name={iconProps.name} size={20} color={iconProps.color} />
      </View>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
            !notification.read && styles.titleUnread,
          ]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={[styles.time, { color: colors.textSecondary }]}>{timeLabel}</Text>
      </View>

      {!notification.read && <View style={[styles.unreadDot, { backgroundColor: semantic.actionBlue }]} />}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={() => onPress(notification)} accessibilityRole="button">
        {card}
      </Pressable>
    );
  }

  return card;
}

function getIconForType(
  type: Notification['type'],
  semantic: (typeof SemanticColors)['light'] | (typeof SemanticColors)['dark']
): { name: React.ComponentProps<typeof Ionicons>['name']; color: string; bgColor: string } {
  switch (type) {
    case 'new_gig':
      return { name: 'musical-notes', color: semantic.actionBlue, bgColor: `${semantic.actionBlue}20` };
    case 'application_approved':
      return { name: 'checkmark-circle', color: semantic.statusAccepted, bgColor: `${semantic.statusAccepted}20` };
    case 'application_declined':
      return { name: 'close-circle', color: semantic.statusDeclined, bgColor: `${semantic.statusDeclined}20` };
  }
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(isoDate).toLocaleDateString();
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.two,
    marginRight: Spacing.two,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  titleUnread: {
    fontWeight: '700',
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default NotificationCard;
