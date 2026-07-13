import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApplicationRow } from '@/components/ApplicationRow';
import { NotificationCard } from '@/components/NotificationCard';
import { SectionHeader } from '@/components/SectionHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { Colors, SemanticColors, Spacing } from '@/constants/theme';
import { useNotificationContext } from '@/context/NotificationContext';
import { MOCK_APPLICATIONS } from '@/data/mockApplications';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Notification } from '@/types';

export default function ActivityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const semantic = SemanticColors[colorScheme];

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationContext();

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <SectionTitle sectionName="Activity" />

        {/* Notifications section */}
        <View style={styles.sectionHeaderRow}>
          <SectionHeader
            title="Notifications"
            actionTitle={unreadCount > 0 ? 'Mark all as read' : undefined}
            onAction={unreadCount > 0 ? markAllAsRead : undefined}
          />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: semantic.accentRed }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No notifications yet
            </Text>
          </View>
        ) : (
          <View style={styles.notificationList}>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={handleNotificationPress}
              />
            ))}
          </View>
        )}

        {/* Applications section */}
        <SectionHeader
          title="Your Applications"
          actionTitle="View All"
          onAction={() => {}}
        />

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
  emptyText: {
    fontSize: 16,
  },
});
