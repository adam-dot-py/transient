import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GigListingCard } from '@/components/GigListingCard';
import { GigMarkerPopup } from '@/components/GigMarkerPopup';
import { AppMapView } from '@/components/MapView';
import { SearchBar } from '@/components/SearchBar';
import { Colors, Spacing } from '@/constants/theme';
import { useGigs } from '@/context/GigContext';
import { MOCK_USER_LOCATION } from '@/data/mockGigs';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Gig, MapRegion } from '@/types';

const INITIAL_REGION: MapRegion = {
  latitude: MOCK_USER_LOCATION.latitude,
  longitude: MOCK_USER_LOCATION.longitude,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * ExploreScreen — Matches the Figma "Explore Page" design.
 *
 * Layout (top to bottom):
 * 1. Search bar with location, date range, genre display
 * 2. Filter + Sort chips with result count
 * 3. Map view with price chip markers
 * 4. Bottom list section (draggable sheet style) with gig listings
 */
export default function ExploreScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const router = useRouter();
  const { getGigsByStatus } = useGigs();

  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [mapError, setMapError] = useState(false);

  const availableGigs = getGigsByStatus('available');

  const handleMarkerPress = (gig: Gig) => {
    setSelectedGig(gig);
  };

  const handleGigPress = (gigId: string) => {
    setSelectedGig(null);
    router.push(`/gig/${gigId}`);
  };

  const handlePopupClose = () => {
    setSelectedGig(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <SearchBar
          location="Nashville, TN"
          dateRange="Sep 12 – 15"
          genre="Acoustic"
        />

        {/* Filter + Sort + Results count */}
        <View style={styles.filterRow}>
          <View style={styles.filterChips}>
            <FilterSortChip label="Filter" icon="chevron-down" />
            <FilterSortChip label="Sort" icon="chevron-down" />
          </View>
          <Text style={[styles.resultCount, { color: colors.text }]}>
            {availableGigs.length} results
          </Text>
        </View>
      </View>

      {/* Map Section */}
      <View style={styles.mapSection}>
        {!mapError ? (
          <ErrorBoundary onError={() => setMapError(true)}>
            <AppMapView
              gigs={availableGigs}
              initialRegion={INITIAL_REGION}
              onMarkerPress={handleMarkerPress}
            />
          </ErrorBoundary>
        ) : (
          <View style={[styles.mapFallback, { backgroundColor: '#FAFCFF' }]}>
            <Text style={{ color: colors.textSecondary }}>Map unavailable</Text>
          </View>
        )}

        {selectedGig && (
          <GigMarkerPopup
            gig={selectedGig}
            onPress={handleGigPress}
            onClose={handlePopupClose}
          />
        )}
      </View>

      {/* Bottom List Section */}
      <View style={[styles.listSection, { backgroundColor: colors.background }]}>
        {/* Handle indicator */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.backgroundSelected }]} />
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {availableGigs.slice(0, 4).map((gig, index) => (
            <View key={gig.id} style={styles.listingItem}>
              <GigListingCard
                gig={gig}
                onPress={handleGigPress}
                distance={`${(1.2 + index * 0.3).toFixed(1)} miles`}
                rating={`${(4.8 - index * 0.1).toFixed(1)}`}
                reviews={500 - index * 100}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/**
 * Small filter/sort chip matching the Figma "Filter" and "Sorting" elements.
 */
function FilterSortChip({ label, icon }: { label: string; icon: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <Pressable style={[styles.sortChip, { borderColor: colors.border }]}>
      <Text style={[styles.sortChipText, { color: colors.text }]}>{label}</Text>
      <Ionicons name={icon as any} size={18} color={colors.text} />
    </Pressable>
  );
}

/**
 * Simple error boundary to catch map rendering failures.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch() {
    this.props.onError();
  }

  override render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Spacing.three,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  sortChipText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  resultCount: {
    fontSize: 14,
    lineHeight: 22,
  },
  mapSection: {
    height: 272,
    position: 'relative',
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSection: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    // Subtle top shadow
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 45,
    height: 5,
    borderRadius: 2.5,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: 32,
  },
  listingItem: {
    // Individual listing
  },
});
