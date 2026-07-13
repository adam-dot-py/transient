import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterChip } from '@/components/FilterChip';
import { GigCard } from '@/components/GigCard';
import { SectionHeader } from '@/components/SectionHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { Colors, Spacing } from '@/constants/theme';
import { useGigs } from '@/context/GigContext';
import { useRole } from '@/context/RoleContext';
import { filterGigsByTimeRange } from '@/data/gigService';
import { CURRENT_USER } from '@/data/mockProfiles';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { GigFilter } from '@/types';

const FILTERS: GigFilter[] = ['all', 'thisWeek', 'nextWeek', 'thisMonth'];

const FILTER_LABELS: Record<GigFilter, string> = {
  all: 'All',
  today: 'Today',
  thisWeek: 'This Week',
  nextWeek: 'Next Week',
  thisMonth: 'This Month',
};

const MAX_CAROUSEL_ITEMS = 20;

export default function HomeScreen() {
  const scheme = useColorScheme();
  const { role } = useRole();

  if (role === 'musician') {
    return <MusicianDashboard scheme={scheme} />;
  }

  return <HosterDashboard scheme={scheme} />;
}

function MusicianDashboard({ scheme }: { scheme: 'light' | 'dark' }) {
  const router = useRouter();
  const { gigs } = useGigs();
  const [selectedFilter, setSelectedFilter] = useState<GigFilter>('all');

  const filteredGigs = useMemo(
    () => filterGigsByTimeRange(gigs, selectedFilter).slice(0, MAX_CAROUSEL_ITEMS),
    [gigs, selectedFilter]
  );

  const handleGigPress = (gigId: string) => {
    router.push(`/gig/${gigId}`);
  };

  const handleFavorite = (gigId: string) => {
    // TODO: implement favorite toggling
  };

  const colors = Colors[scheme];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Section Title */}
        <SectionTitle sectionName="Home" />

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}
        >
          {FILTERS.map((filter) => (
            <FilterChip
              key={filter}
              title={FILTER_LABELS[filter]}
              isSelected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
            />
          ))}
        </ScrollView>

        {/* Nearby Gigs Section — large cards (270x259) */}
        <SectionHeader
          title="Nearby Gigs"
          actionTitle="See All"
          onAction={() => {
            // TODO: navigate to full gig list
          }}
        />

        {filteredGigs.length > 0 ? (
          <FlatList
            horizontal
            data={filteredGigs}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <GigCard
                  gig={item}
                  variant="large"
                  onPress={handleGigPress}
                  onFavorite={handleFavorite}
                />
              </View>
            )}
            scrollEnabled
          />
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No gigs match the selected filter
          </Text>
        )}

        {/* Recommended Gigs Section — smaller cards (270x150) */}
        <SectionHeader title="Recommended Gigs" />

        {filteredGigs.length > 0 ? (
          <FlatList
            horizontal
            data={filteredGigs}
            keyExtractor={(item) => `rec-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <GigCard
                  gig={item}
                  variant="default"
                  onPress={handleGigPress}
                  onFavorite={handleFavorite}
                />
              </View>
            )}
            scrollEnabled
          />
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No gigs match the selected filter
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HosterDashboard({ scheme }: { scheme: 'light' | 'dark' }) {
  const router = useRouter();
  const { getHosterGigs } = useGigs();

  const { active, past } = getHosterGigs(CURRENT_USER.id);

  const handleGigPress = (gigId: string) => {
    router.push(`/gig/hoster/${gigId}`);
  };

  const handleCreateGig = () => {
    router.push('/gig/create');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[scheme].background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <SectionTitle sectionName="Home" />
        <Pressable
          style={[styles.createButton, { backgroundColor: Colors[scheme].backgroundSelected }]}
          onPress={handleCreateGig}
          accessibilityRole="button"
          accessibilityLabel="Create Gig"
        >
          <Text style={[styles.createButtonText, { color: Colors[scheme].text }]}>
            + Create Gig
          </Text>
        </Pressable>

        {active.length > 0 ? (
          <>
            <SectionHeader title="Active Gigs" />
            <FlatList
              horizontal
              data={active}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <GigCard gig={item} onPress={handleGigPress} />
                </View>
              )}
              scrollEnabled
            />
          </>
        ) : (
          <Text style={[styles.emptyText, { color: Colors[scheme].textSecondary }]}>
            No active gigs
          </Text>
        )}

        {past.length > 0 ? (
          <>
            <SectionHeader title="Past Gigs" />
            <FlatList
              horizontal
              data={past}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <GigCard gig={item} onPress={handleGigPress} />
                </View>
              )}
              scrollEnabled
            />
          </>
        ) : (
          <Text style={[styles.emptyText, { color: Colors[scheme].textSecondary }]}>
            No past gigs
          </Text>
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
    paddingBottom: Spacing.five,
  },
  chipScroll: {
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  chipRow: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  carouselContent: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  cardWrapper: {
    marginRight: Spacing.two,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  createButton: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
