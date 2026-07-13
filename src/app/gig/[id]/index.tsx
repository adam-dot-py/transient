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
import { Colors, SemanticColors, Spacing } from '@/constants/theme';
import { useApplications } from '@/context/ApplicationContext';
import { useGigs } from '@/context/GigContext';
import { useRole } from '@/context/RoleContext';
import { formatPay } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';

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
  const [bannerVisible, setBannerVisible] = useState(false);

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
    setBannerVisible(true);
  };

  const handleBannerDismiss = () => {
    setBannerVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ConfirmationBanner
        message="Gig accepted!"
        visible={bannerVisible}
        durationMs={3000}
        onDismiss={handleBannerDismiss}
      />

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

            {/* Apply button */}
            {!isAccepted && gig.status === 'available' && (
              <Pressable
                style={styles.applyButton}
                onPress={handleAcceptGig}
                accessibilityRole="button"
                accessibilityLabel="Apply for this gig"
              >
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>Apply</Text>
              </Pressable>
            )}

            {isAccepted && (
              <View style={[styles.applyButton, styles.appliedButton]}>
                <Ionicons name="checkmark-done" size={22} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>Applied</Text>
              </View>
            )}
          </View>
        </View>

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
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: '#38B5D7',
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
    backgroundColor: '#38B5D7',
    borderRadius: 8,
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
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
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
    backgroundColor: '#38B5D7',
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
