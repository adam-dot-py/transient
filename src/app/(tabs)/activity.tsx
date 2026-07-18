import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApplicationRow } from '@/components/ApplicationRow';
import { NotificationCard } from '@/components/NotificationCard';
import { ProfileAvatarMenu } from '@/components/ProfileAvatarMenu';
import { ScreenBackground } from '@/components/ScreenBackground';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useNotificationContext } from '@/context/NotificationContext';
import { MOCK_APPLICATIONS } from '@/data/mockApplications';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Notification } from '@/types';

type NotificationFilter = 'all' | 'recent' | 'unread';

export default function ActivityScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationContext();

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'recent':
        // Sort by most recent (already sorted, but ensure descending)
        return [...notifications].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'unread':
        return notifications.filter((n) => !n.read);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const handleApplicationPress = (applicationId: string) => {
    const application = MOCK_APPLICATIONS.find((app) => app.id === applicationId);
    const gigId = application?.gigId ?? applicationId;
    router.push(`/gig/${gigId}`);
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.data?.gigId) {
      router.push(`/gig/${notification.data.gigId}`);
    }
  };

  return (
    <ScreenBackground>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <ProfileAvatarMenu />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Activity</Text>
        </View>

        {/* Filter buttons */}
        <View style={styles.filterRow}>
          <FilterButton
            label="All"
            icon="grid-outline"
            active={filter === 'all'}
            onPress={() => setFilter('all')}
            scheme={scheme}
          />
          <FilterButton
            label="Recent"
            icon="time-outline"
            active={filter === 'recent'}
            onPress={() => setFilter('recent')}
            scheme={scheme}
          />
          <FilterButton
            label="Unread"
            icon="mail-unread-outline"
            active={filter === 'unread'}
            onPress={() => setFilter('unread')}
            badge={unreadCount > 0 ? unreadCount : undefined}
            scheme={scheme}
          />
        </View>

        {/* Notifications section header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Pressable onPress={markAllAsRead} accessibilityRole="button">
              <Text style={[styles.markReadText, { color: Brand.blue }]}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationList}>
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={handleNotificationPress}
              />
            ))}
          </View>
        )}

        {/* Applications section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Applications</Text>
        </View>

        {MOCK_APPLICATIONS.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No applications yet
            </Text>
          </View>
        ) : (
          <View style={styles.applicationList}>
            {MOCK_APPLICATIONS.map((application) => (
              <ApplicationRow
                key={application.id}
                application={application}
                onPress={handleApplicationPress}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function FilterButton({
  label,
  icon,
  active,
  onPress,
  badge,
  scheme,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
  scheme: 'light' | 'dark';
}) {
  const colors = Colors[scheme];

  return (
    <Pressable
      style={[
        styles.filterButton,
        {
          backgroundColor: active ? Brand.purple : colors.backgroundElement,
          borderColor: active ? Brand.purple : colors.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Ionicons
        name={icon as any}
        size={14}
        color={active ? '#FFFFFF' : colors.textSecondary}
      />
      <Text
        style={[
          styles.filterButtonText,
          { color: active ? '#FFFFFF' : colors.text },
        ]}
      >
        {label}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.filterBadge, { backgroundColor: active ? '#FFFFFF' : Brand.purple }]}>
          <Text style={[styles.filterBadgeText, { color: active ? Brand.purple : '#FFFFFF' }]}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.48,
    lineHeight: 34,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '500',
  },
  notificationList: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  applicationList: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  emptyText: {
    fontSize: 15,
  },
});
