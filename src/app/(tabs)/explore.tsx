import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterChip } from '@/components/FilterChip';
import { GigListingCard } from '@/components/GigListingCard';
import { GigMarkerPopup } from '@/components/GigMarkerPopup';
import { AppMapView } from '@/components/MapView';
import { SearchBar } from '@/components/SearchBar';
import { AMPLIFY_CONFIG } from '@/services/stripeService';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useGigs } from '@/context/GigContext';
import { ALL_GENRES, GENRE_LABELS } from '@/data/genres';
import {
  DEFAULT_USER_LOCATION,
  describeLocationError,
  getDeviceLocation,
  resolveManualLocation,
  type UserLocation,
} from '@/data/locationService';
import {
  DEFAULT_SEARCH_CRITERIA,
  searchGigs,
  type SearchCriteria,
  type SortBy,
} from '@/data/searchService';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Gig, Genre, MapRegion } from '@/types';

/** User-facing labels for each sort mode. */
const SORT_LABELS: Record<SortBy, string> = {
  distance: 'Nearest',
  payHighToLow: 'Pay: High to Low',
  payLowToHigh: 'Pay: Low to High',
  dateSoonest: 'Date: Soonest',
};

const SORT_MODES: SortBy[] = ['distance', 'payHighToLow', 'payLowToHigh', 'dateSoonest'];

/**
 * ExploreScreen — Matches the Figma "Explore Page" design.
 *
 * Layout (top to bottom):
 * 1. Editable search bar driving the free-text query
 * 2. Filter + Sort chips with the real result count
 * 3. Map view (reflects the filtered results)
 * 4. Bottom list section with gig listings and real per-gig distances
 */
export default function ExploreScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const router = useRouter();
  const { getGigsByStatus } = useGigs();

  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [mapError, setMapError] = useState(false);
  const [criteria, setCriteria] = useState<SearchCriteria>(DEFAULT_SEARCH_CRITERIA);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [origin, setOrigin] = useState<UserLocation>(DEFAULT_USER_LOCATION);
  const [locationOpen, setLocationOpen] = useState(false);

  const availableGigs = getGigsByStatus('available');

  // Pure dev-loop path: synchronous, no flicker. The component contract
  // (GigWithDistance[]) is identical to fetchSearchResults for the Supabase path.
  // Distances are measured from the user-selected origin (device GPS or manual).
  const results = useMemo(
    () => searchGigs(availableGigs, origin, criteria),
    [availableGigs, origin, criteria]
  );

  // Center the map on the active origin.
  const region = useMemo<MapRegion>(
    () => ({
      latitude: origin.latitude,
      longitude: origin.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    [origin]
  );

  // The map reflects the active filters.
  const mapGigs = useMemo(() => results.map((r) => r.gig), [results]);

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
          location={origin.label}
          dateRange="Sep 12 – 15"
          genre="Acoustic"
          value={criteria.query}
          onChangeText={(text) => setCriteria((c) => ({ ...c, query: text }))}
          onOptionsPress={() => setFilterOpen(true)}
          onLocationPress={() => setLocationOpen(true)}
        />

        {/* Filter + Sort + Results count */}
        <View style={styles.filterRow}>
          <View style={styles.filterChips}>
            <FilterSortChip
              label="Filter"
              icon="options-outline"
              active={isFilterActive(criteria)}
              onPress={() => setFilterOpen(true)}
            />
            <FilterSortChip
              label={SORT_LABELS[criteria.sortBy]}
              icon="swap-vertical"
              active={criteria.sortBy !== DEFAULT_SEARCH_CRITERIA.sortBy}
              onPress={() => setSortOpen(true)}
            />
          </View>
          <Text style={[styles.resultCount, { color: colors.text }]}>
            {results.length} results
          </Text>
        </View>
      </View>

      {/* Map Section */}
      <View style={styles.mapSection}>
        {!mapError ? (
          <ErrorBoundary onError={() => setMapError(true)}>
            <AppMapView
              gigs={mapGigs}
              initialRegion={region}
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
          {results.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No gigs match your search. Try adjusting your filters.
            </Text>
          ) : (
            results.map(({ gig, distanceMiles }) => (
              <View key={gig.id} style={styles.listingItem}>
                <GigListingCard
                  gig={gig}
                  onPress={handleGigPress}
                  distance={
                    distanceMiles === null ? '—' : `${distanceMiles.toFixed(1)} miles`
                  }
                />
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Filter bottom-sheet */}
      <FilterSheet
        visible={filterOpen}
        criteria={criteria}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setCriteria(next);
          setFilterOpen(false);
        }}
      />

      {/* Sort menu */}
      <SortMenu
        visible={sortOpen}
        sortBy={criteria.sortBy}
        onClose={() => setSortOpen(false)}
        onSelect={(sortBy) => {
          setCriteria((c) => ({ ...c, sortBy }));
          setSortOpen(false);
        }}
      />

      {/* Location picker */}
      <LocationSheet
        visible={locationOpen}
        current={origin}
        onClose={() => setLocationOpen(false)}
        onResolved={(next) => {
          setOrigin(next);
          setLocationOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

/** Returns true when any non-sort filter is active. */
function isFilterActive(c: SearchCriteria): boolean {
  return (
    c.genres.length > 0 ||
    c.minPay !== undefined ||
    c.maxPay !== undefined ||
    c.maxDistanceMiles !== undefined
  );
}

/**
 * Small filter/sort chip matching the Figma "Filter" and "Sorting" elements.
 */
function FilterSortChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active?: boolean;
  onPress?: () => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <Pressable
      style={[
        styles.sortChip,
        {
          borderColor: active ? Brand.purple : colors.border,
          backgroundColor: active ? Brand.purple : 'transparent',
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.sortChipText, { color: active ? '#FFFFFF' : colors.text }]}>
        {label}
      </Text>
      <Ionicons name={icon} size={18} color={active ? '#FFFFFF' : colors.text} />
    </Pressable>
  );
}

/**
 * FilterSheet — slide-up bottom sheet for genre, pay range and radius filters.
 * Edits a local draft so changes apply atomically on "Apply".
 */
function FilterSheet({
  visible,
  criteria,
  onClose,
  onApply,
}: {
  visible: boolean;
  criteria: SearchCriteria;
  onClose: () => void;
  onApply: (next: SearchCriteria) => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const [draft, setDraft] = useState<SearchCriteria>(criteria);

  const toggleGenre = (genre: Genre) => {
    setDraft((d) => ({
      ...d,
      genres: d.genres.includes(genre)
        ? d.genres.filter((g) => g !== genre)
        : [...d.genres, genre],
    }));
  };

  const setPay = (key: 'minPay' | 'maxPay', text: string) => {
    const trimmed = text.trim();
    const value = trimmed === '' ? undefined : Number(trimmed);
    setDraft((d) => ({
      ...d,
      [key]: value !== undefined && Number.isFinite(value) ? value : undefined,
    }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={() => setDraft(criteria)}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.sheetHandleRow}>
          <View style={[styles.handle, { backgroundColor: colors.backgroundSelected }]} />
        </View>

        <ScrollView contentContainerStyle={styles.sheetContent}>
          {/* Genres */}
          <Text style={[styles.sheetSectionTitle, { color: colors.text }]}>Genres</Text>
          <View style={styles.chipWrap}>
            {ALL_GENRES.map((genre) => (
              <FilterChip
                key={genre}
                title={GENRE_LABELS[genre]}
                isSelected={draft.genres.includes(genre)}
                onPress={() => toggleGenre(genre)}
              />
            ))}
          </View>

          {/* Pay range */}
          <Text style={[styles.sheetSectionTitle, { color: colors.text }]}>Pay range</Text>
          <View style={styles.payRow}>
            <TextInput
              style={[
                styles.payInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement },
              ]}
              keyboardType="numeric"
              placeholder="Min"
              placeholderTextColor={colors.textSecondary}
              value={draft.minPay !== undefined ? String(draft.minPay) : ''}
              onChangeText={(t) => setPay('minPay', t)}
              accessibilityLabel="Minimum pay"
            />
            <Text style={[styles.payDash, { color: colors.textSecondary }]}>–</Text>
            <TextInput
              style={[
                styles.payInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement },
              ]}
              keyboardType="numeric"
              placeholder="Max"
              placeholderTextColor={colors.textSecondary}
              value={draft.maxPay !== undefined ? String(draft.maxPay) : ''}
              onChangeText={(t) => setPay('maxPay', t)}
              accessibilityLabel="Maximum pay"
            />
          </View>

          {/* Distance */}
          <Text style={[styles.sheetSectionTitle, { color: colors.text }]}>Distance</Text>
          <View style={styles.chipWrap}>
            <FilterChip
              title="Any"
              isSelected={draft.maxDistanceMiles === undefined}
              onPress={() => setDraft((d) => ({ ...d, maxDistanceMiles: undefined }))}
            />
            {AMPLIFY_CONFIG.radiusOptions.map((miles) => (
              <FilterChip
                key={miles}
                title={`${miles} mi`}
                isSelected={draft.maxDistanceMiles === miles}
                onPress={() => setDraft((d) => ({ ...d, maxDistanceMiles: miles }))}
              />
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.sheetFooter}>
          <Pressable
            style={[styles.footerButton, styles.resetButton, { borderColor: colors.border }]}
            onPress={() => setDraft(DEFAULT_SEARCH_CRITERIA)}
            accessibilityRole="button"
            accessibilityLabel="Reset filters"
          >
            <Text style={[styles.resetButtonText, { color: colors.text }]}>Reset</Text>
          </Pressable>
          <Pressable
            style={[styles.footerButton, styles.applyButton]}
            onPress={() => onApply(draft)}
            accessibilityRole="button"
            accessibilityLabel="Apply filters"
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * SortMenu — slide-up action sheet listing the four sort modes.
 * The active mode is checkmarked.
 */
function SortMenu({
  visible,
  sortBy,
  onClose,
  onSelect,
}: {
  visible: boolean;
  sortBy: SortBy;
  onClose: () => void;
  onSelect: (sortBy: SortBy) => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, styles.menuSheet, { backgroundColor: colors.background }]}>
        <View style={styles.sheetHandleRow}>
          <View style={[styles.handle, { backgroundColor: colors.backgroundSelected }]} />
        </View>
        <Text style={[styles.sheetSectionTitle, { color: colors.text, paddingHorizontal: Spacing.three }]}>
          Sort by
        </Text>
        {SORT_MODES.map((mode) => {
          const selected = mode === sortBy;
          return (
            <Pressable
              key={mode}
              style={styles.menuItem}
              onPress={() => onSelect(mode)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={SORT_LABELS[mode]}
            >
              <Text
                style={[
                  styles.menuItemText,
                  { color: selected ? Brand.purple : colors.text },
                ]}
              >
                {SORT_LABELS[mode]}
              </Text>
              {selected && <Ionicons name="checkmark" size={20} color={Brand.purple} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

/**
 * LocationSheet — choose the search origin via device GPS or manual city entry.
 *
 * "Use my location" calls the device GPS (expo-location) through the mock-first
 * locationService; the city field resolves a typed name via the geocoder. Both
 * paths return a resolved UserLocation (or a friendly error message shown
 * inline). The chosen origin drives all distance calculations on the screen.
 */
function LocationSheet({
  visible,
  current,
  onClose,
  onResolved,
}: {
  visible: boolean;
  current: UserLocation;
  onClose: () => void;
  onResolved: (next: UserLocation) => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const [city, setCity] = useState('');
  const [busy, setBusy] = useState<null | 'device' | 'manual'>(null);
  const [error, setError] = useState<string | null>(null);

  const resetSheet = () => {
    setCity('');
    setBusy(null);
    setError(null);
  };

  const useDevice = async () => {
    setBusy('device');
    setError(null);
    const result = await getDeviceLocation();
    setBusy(null);
    if (result.ok) {
      onResolved(result.location);
    } else {
      setError(describeLocationError(result.reason));
    }
  };

  const useManual = async () => {
    setBusy('manual');
    setError(null);
    const result = await resolveManualLocation(city);
    setBusy(null);
    if (result.ok) {
      onResolved(result.location);
    } else {
      setError(describeLocationError(result.reason));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={resetSheet}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.sheetHandleRow}>
          <View style={[styles.handle, { backgroundColor: colors.backgroundSelected }]} />
        </View>

        <View style={styles.sheetContent}>
          <Text style={[styles.sheetSectionTitle, { color: colors.text }]}>Search location</Text>
          <Text style={[styles.locationCurrent, { color: colors.textSecondary }]}>
            Showing gigs near {current.label}
          </Text>

          {/* Use my location */}
          <Pressable
            style={[styles.deviceButton, { borderColor: colors.border }]}
            onPress={useDevice}
            disabled={busy !== null}
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
          >
            {busy === 'device' ? (
              <ActivityIndicator size="small" color={Brand.purple} />
            ) : (
              <Ionicons name="navigate" size={20} color={Brand.purple} />
            )}
            <Text style={[styles.deviceButtonText, { color: colors.text }]}>
              Use my location
            </Text>
          </Pressable>

          <Text style={[styles.locationOr, { color: colors.textSecondary }]}>or enter a city</Text>

          {/* Manual city entry */}
          <View style={styles.payRow}>
            <TextInput
              style={[
                styles.payInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement },
              ]}
              placeholder="e.g. Nashville, Memphis, Franklin"
              placeholderTextColor={colors.textSecondary}
              value={city}
              onChangeText={setCity}
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={useManual}
              accessibilityLabel="City name"
            />
            <Pressable
              style={[styles.footerButton, styles.applyButton, styles.citySearchButton]}
              onPress={useManual}
              disabled={busy !== null || city.trim().length === 0}
              accessibilityRole="button"
              accessibilityLabel="Search this city"
            >
              {busy === 'manual' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.applyButtonText}>Go</Text>
              )}
            </Pressable>
          </View>

          {error && (
            <Text style={[styles.locationError, { color: Brand.magenta }]}>{error}</Text>
          )}
        </View>
      </View>
    </Modal>
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
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
  // ─── Bottom sheet ───────────────────────────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Spacing.four,
  },
  menuSheet: {
    paddingBottom: Spacing.five,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetContent: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  sheetSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  payInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  payDash: {
    fontSize: 16,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  footerButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: Brand.purple,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // ─── Sort menu ───────────────────────────────────────────────────────────────
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // ─── Location sheet ────────────────────────────────────────────────────────
  locationCurrent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.two,
  },
  deviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
  },
  deviceButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationOr: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  citySearchButton: {
    flex: 0,
    width: 64,
    height: 'auto',
    alignSelf: 'stretch',
  },
  locationError: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.two,
  },
});
