import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmationBanner } from '@/components/ConfirmationBanner';
import { GradientBorder } from '@/components/GradientBorder';
import { Brand, Colors, SemanticColors, Spacing } from '@/constants/theme';
import { useApplications } from '@/context/ApplicationContext';
import { useGigs } from '@/context/GigContext';
import { useRole } from '@/context/RoleContext';
import { formatPay } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { ExampleSong } from '@/types';

/** Mock example songs for demo — in production these come from the example_songs table */
const MOCK_SONGS: ExampleSong[] = [
  { id: 'song-1', title: 'Superstition', artist: 'Stevie Wonder', sortOrder: 1 },
  { id: 'song-2', title: 'Ain\'t No Sunshine', artist: 'Bill Withers', sortOrder: 2 },
  { id: 'song-3', title: 'Fly Me to the Moon', artist: 'Frank Sinatra', sortOrder: 3 },
];

/**
 * GigDetailScreen — Matches the Figma "Gig Overview Page".
 *
 * Layout:
 * 1. "Gig Overview" title bar
 * 2. Large hero card with image, location overlay, genre pills, price badge, and Apply button
 * 3. "Description" section heading
 * 4. Description text with a gradient fade-out
 */
export default function GigDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getGigById, acceptGig, addToRecentlyViewed } = useGigs();
  const { role } = useRole();
  const { getApplicationsForGig } = useApplications();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const semantic = SemanticColors[colorScheme];

  const gig = getGigById(id);
  const isHoster = role === 'hoster';
  const applicationCount = id ? getApplicationsForGig(id).length : 0;

  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    if (gig) {
      addToRecentlyViewed(gig.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!gig) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>
            Gig not found
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isAccepted = gig.status === 'accepted' || accepted;

  const handleAcceptGig = () => {
    acceptGig(gig.id);
    setAccepted(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title bar */}
        <View style={styles.titleBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Gig Overview</Text>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          {/* Background gradient placeholder for gig image */}
          <LinearGradient
            colors={[semantic.cardImageGradientStart, semantic.cardImageGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Warm glow accent */}
          <View style={styles.heroGlow} />

          {/* Dark overlay gradient at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.5)']}
            style={styles.heroBottomGradient}
          />

          {/* Location overlay box */}
          <View style={styles.locationOverlay}>
            {/* Top row: venue name + price */}
            <View style={styles.overlayTopRow}>
              <View style={styles.overlayTextContainer}>
                <Text style={styles.overlayVenueName} numberOfLines={1}>
                  {gig.venueName}
                </Text>
                <Text style={styles.overlayCity}>
                  {gig.city}, {gig.country}
                </Text>
              </View>

              {/* Price badge */}
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{formatPay(gig.pay)}</Text>
              </View>
            </View>

            {/* Genre pills */}
            <View style={styles.genreRow}>
              {gig.genres.map((genre) => (
                <View key={genre} style={styles.genrePill}>
                  <Text style={styles.genrePillText}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Details Section — Time & Location pills + Map */}
        <View style={styles.detailsSection}>
          {/* Date & Time pill */}
          <View style={[styles.detailPill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={[styles.detailIconCircle, { backgroundColor: Brand.purple + '15' }]}>
              <Ionicons name="calendar" size={16} color={Brand.purple} />
            </View>
            <View style={styles.detailPillContent}>
              <Text style={[styles.detailPillLabel, { color: colors.textSecondary }]}>Date & Time</Text>
              <Text style={[styles.detailPillValue, { color: colors.text }]}>
                {gig.date}
              </Text>
              <Text style={[styles.detailPillSub, { color: colors.textSecondary }]}>
                {gig.startTime} – {gig.endTime}
              </Text>
            </View>
          </View>

          {/* Location pill */}
          <View style={[styles.detailPill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={[styles.detailIconCircle, { backgroundColor: Brand.blue + '15' }]}>
              <Ionicons name="location" size={16} color={Brand.blue} />
            </View>
            <View style={styles.detailPillContent}>
              <Text style={[styles.detailPillLabel, { color: colors.textSecondary }]}>Location</Text>
              <Text style={[styles.detailPillValue, { color: colors.text }]}>
                {gig.venueName}
              </Text>
              <Text style={[styles.detailPillSub, { color: colors.textSecondary }]}>
                {gig.addressLine1}, {gig.city}
              </Text>
            </View>
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
            <MapPlaceholder latitude={gig.latitude} longitude={gig.longitude} colors={colors} />
          </View>
        </View>

        {/* Genres Section */}
        {gig.genres.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Genres</Text>
            <View style={styles.brandPillRow}>
              {gig.genres.map((genre) => (
                <View key={genre} style={[styles.brandPill, { borderColor: Brand.purple + '50' }]}>
                  <Text style={[styles.brandPillText, { color: Brand.purple }]}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Example Songs Section */}
        {MOCK_SONGS.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Sample Songs</Text>
            {MOCK_SONGS.map((song, index) => (
              <View key={song.id} style={[styles.songRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.songIndex, { color: colors.textSecondary }]}>{index + 1}</Text>
                <Ionicons name="musical-note" size={16} color={Brand.purple} />
                <View style={styles.songInfo}>
                  <Text style={[styles.songTitle, { color: colors.text }]}>{song.title}</Text>
                  <Text style={[styles.songArtist, { color: colors.textSecondary }]}>{song.artist}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={[styles.descriptionTitle, { color: colors.text }]}>
            Description
          </Text>

          {/* View Applications button for hosters */}
          {isHoster && (
            <Pressable
              style={styles.viewApplicationsButton}
              onPress={() => router.push(`/gig/${id}/applications`)}
              accessibilityRole="button"
              accessibilityLabel={`View Applications, ${applicationCount} applications`}
            >
              <Ionicons name="people" size={20} color="#FFFFFF" />
              <Text style={styles.viewApplicationsButtonText}>
                View Applications ({applicationCount})
              </Text>
            </Pressable>
          )}

          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {gig.description || 'No description provided for this gig.'}
          </Text>

          {/* Apply button — full width, brand gradient, below description */}
          {!isAccepted && gig.status === 'available' && !isHoster && (
            <>
              <Pressable
                style={styles.applyButtonFull}
                onPress={handleAcceptGig}
                accessibilityRole="button"
                accessibilityLabel="Apply for this gig"
              >
                <LinearGradient
                  colors={[Brand.purple, Brand.blue, Brand.cyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyButtonGradient}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.applyButtonFullText}>Apply for this Gig</Text>
                </LinearGradient>
              </Pressable>
              <Text style={[styles.applyDisclaimer, { color: colors.textSecondary }]}>
                Your profile, including your bio, genres, and music links, will be shared with the host for their consideration.
              </Text>
            </>
          )}

          {isAccepted && (
            <View style={styles.appliedBanner}>
              <Ionicons name="checkmark-done" size={20} color={Brand.purple} />
              <Text style={[styles.appliedBannerText, { color: Brand.purple }]}>Applied</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Map placeholder — shows a branded location card.
 * react-native-maps requires a native dev client build and crashes in Expo Go,
 * so we always show this styled placeholder in development.
 */
function MapPlaceholder({
  latitude,
  longitude,
  colors,
}: {
  latitude: number;
  longitude: number;
  colors: typeof Colors.light;
}) {
  return (
    <LinearGradient
      colors={[Brand.purple + '15', Brand.blue + '10', Brand.cyan + '08']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.map}
    >
      <View style={styles.mapFallback}>
        <Ionicons name="location" size={32} color={Brand.purple} />
        <Text style={[styles.mapFallbackText, { color: colors.text }]}>
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>
        <Text style={[styles.mapFallbackSub, { color: colors.textSecondary }]}>
          Map available in production build
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.48,
    lineHeight: 34,
  },
  heroCard: {
    marginHorizontal: Spacing.three,
    height: 329,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      android: { elevation: 4 },
      default: {
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  heroGlow: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFCE4',
    opacity: 0.3,
  },
  heroBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  locationOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(29, 29, 29, 0.4)',
    borderRadius: 15,
    padding: 16,
    gap: 10,
  },
  overlayTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  overlayTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  overlayVenueName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  overlayCity: {
    fontSize: 14,
    color: '#CAC8C8',
  },
  priceBadge: {
    backgroundColor: '#34C759',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  priceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genrePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  genrePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 17,
  },
  applyButton: {
    backgroundColor: Brand.purple,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-end',
  },
  appliedButton: {
    backgroundColor: '#424242',
    opacity: 0.8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  applyButtonFull: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: Spacing.four,
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  applyButtonFullText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  applyDisclaimer: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.four,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Brand.purple,
  },
  appliedBannerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  descriptionSection: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: Spacing.two,
  },
  viewApplicationsButton: {
    backgroundColor: Brand.purple,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  viewApplicationsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  // ─── Details Section (Date/Time, Location, Map) ────────────────────────
  detailsSection: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: 12,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  detailIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPillContent: {
    flex: 1,
  },
  detailPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailPillValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  detailPillSub: {
    fontSize: 13,
    marginTop: 1,
  },
  mapContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  map: {
    height: 160,
    width: '100%',
    borderRadius: 14,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapFallbackText: {
    fontSize: 13,
    fontWeight: '500',
  },
  mapFallbackSub: {
    fontSize: 11,
  },
  // ─── Genres & Songs Sections ───────────────────────────────────────────
  sectionBlock: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  brandPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  brandPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  songIndex: {
    width: 22,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  songArtist: {
    fontSize: 13,
    marginTop: 1,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: Spacing.four,
  },
  backButton: {
    backgroundColor: Brand.purple,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
