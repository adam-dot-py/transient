import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ApplicationActions from '@/components/ApplicationActions';
import ApplicationCard from '@/components/ApplicationCard';
import { Colors, Spacing } from '@/constants/theme';
import { useApplications } from '@/context/ApplicationContext';
import { mockApplicationsExtended } from '@/data/mockApplicationsExtended';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { ApplicationWithProfile } from '@/types';

/**
 * ApplicationsScreen — displays all applications for a given gig (host view).
 *
 * Fetches application records from context, then joins with
 * mockApplicationsExtended to get full musician profile data for display.
 * Provides approve/deny actions for each pending application.
 */
export default function ApplicationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getApplicationsForGig, approveApplication, denyApplication } =
    useApplications();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const applicationRecords = getApplicationsForGig(id);

  // Join application records with full profile data from mock extended data
  const applicationsWithProfiles: ApplicationWithProfile[] = applicationRecords
    .map((record) => {
      const extended = mockApplicationsExtended.find(
        (ext) => ext.id === record.id
      );
      if (extended) {
        return { ...extended, status: record.status };
      }
      // Fallback: build minimal profile from record if not in extended mock
      return null;
    })
    .filter((app): app is ApplicationWithProfile => app !== null);

  const handleApprove = (applicationId: string) => {
    approveApplication(applicationId, { acceptedMusicianIds: [] });
  };

  const handleDeny = (applicationId: string) => {
    denyApplication(applicationId);
  };

  const renderItem = ({ item }: { item: ApplicationWithProfile }) => (
    <View style={styles.cardWrapper}>
      <ApplicationCard application={item} />
      <ApplicationActions
        status={item.status}
        onApprove={() => handleApprove(item.id)}
        onDeny={() => handleDeny(item.id)}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Applications
        </Text>
      </View>

      {applicationsWithProfiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No applications yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={applicationsWithProfiles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.48,
    lineHeight: 34,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  cardWrapper: {
    gap: Spacing.one,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
