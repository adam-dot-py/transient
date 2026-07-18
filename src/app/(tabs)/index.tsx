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

import { FilterChip } from '@/components/FilterChip';
import { GigCard } from '@/components/GigCard';
import { ProfileAvatarMenu } from '@/components/ProfileAvatarMenu';
import { RoleToggle } from '@/components/RoleToggle';
import { ScreenBackground } from '@/components/ScreenBackground';
import { SectionHeader } from '@/components/SectionHeader';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useGigs } from '@/context/GigContext';
import { useProfile } from '@/context/ProfileContext';
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

const FILTER_ICONS: Record<GigFilter, string> = {
  all: 'grid-outline',
  today: 'today-outline',
  thisWeek: 'calendar-outline',
  nextWeek: 'calendar-number-outline',
  thisMonth: 'albums-outline',
};

const MAX_CAROUSEL_ITEMS = 20;

export default function HomeScreen() {
  const { role } = useRole();
  const scheme = useColorScheme();

  if (role === 'musician') {
    return <MusicianDashboard scheme={scheme} />;
  }

  return <HosterDashboard scheme={scheme} />;
}

function MusicianDashboard({ scheme }: { scheme: 'light' | 'dark' }) {
  const router = useRouter();
  const { gigs } = useGigs();
  const { profile } = useProfile();
  const [selectedFilter, setSelectedFilter] = useState<GigFilter>('all');
  const colors = Colors[scheme];

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

  return (
    <ScreenBackground>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header row: Avatar + Greeting + Role Toggle */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <ProfileAvatarMenu />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Hi, {profile?.displayName?.split(' ')[0] ?? 'there'}! {'\u{1F44B}'}
            </Text>
          </View>
          <RoleToggle />
        </View>

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
              icon={FILTER_ICONS[filter] as any}
              isSelected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
            />
          ))}
        </ScrollView>

        {/* Nearby Gigs Section */}
        <SectionHeader
          title="Nearby Gigs"
          actionTitle="See All"
          onAction={() => {}}
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

        {/* Recommended Gigs Section */}
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
    </ScreenBackground>
  );
}

function HosterDashboard({ scheme }: { scheme: 'light' | 'dark' }) {
  const router = useRouter();
  const { getHosterGigs } = useGigs();
  const { profile } = useProfile();
  const colors = Colors[scheme];

  const { active, past } = getHosterGigs(CURRENT_USER.id);

  const handleGigPress = (gigId: string) => {
    router.push(`/gig/hoster/${gigId}`);
  };

  const handleCreateGig = () => {
    router.push('/(tabs)/create');
  };

  return (
    <ScreenBackground>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header row: Avatar + Greeting + Role Toggle */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <ProfileAvatarMenu />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Hi, {profile?.displayName?.split(' ')[0] ?? 'there'}! {'\u{1F44B}'}
            </Text>
          </View>
          <RoleToggle />
        </View>

        <Pressable
          style={[styles.createButton, { borderColor: Brand.purple + '40' }]}
          onPress={handleCreateGig}
          accessibilityRole="button"
          accessibilityLabel="Create Gig"
        >
          <Text style={[styles.createButtonText, { color: Brand.purple }]}>+ Create Gig</Text>
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
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No past gigs
          </Text>
        )}
      </ScrollView>
    </ScreenBackground>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.48,
    lineHeight: 34,
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
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
