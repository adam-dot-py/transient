import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, SemanticColors } from '@/constants/theme';
import { formatPay } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Gig } from '@/types';

interface GigListingCardProps {
  gig: Gig;
  onPress: (gigId: string) => void;
  /** Simulated distance for display */
  distance?: string;
  /** Simulated rating for display */
  rating?: string;
  reviews?: number;
}

/**
 * GigListingCard — Matches the Figma "Location Info" component in the Explore list.
 *
 * Features:
 * - Image carousel area (gradient placeholder) with pagination dots
 * - Info section with venue name, star rating, distance
 * - Price + "Select" CTA button
 */
export function GigListingCard({
  gig,
  onPress,
  distance = '1.2 miles',
  rating = '4.8',
  reviews = 500,
}: GigListingCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const semantic = SemanticColors[scheme];

  return (
    <View style={styles.container}>
      {/* Image carousel area */}
      <Pressable
        style={styles.imageContainer}
        onPress={() => onPress(gig.id)}
        accessibilityRole="button"
        accessibilityLabel={`View ${gig.venueName}`}
      >
        <LinearGradient
          colors={[semantic.cardImageGradientStart, semantic.cardImageGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Pagination dots */}
        <View style={styles.pagination}>
          <View style={[styles.paginationDot, styles.paginationDotActive]} />
          <View style={styles.paginationDot} />
          <View style={styles.paginationDot} />
          <View style={styles.paginationDot} />
          <View style={styles.paginationDot} />
        </View>
      </Pressable>

      {/* Info section */}
      <View style={styles.infoContainer}>
        {/* Venue name */}
        <View style={styles.textSection}>
          <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={1}>
            {gig.venueName}
          </Text>

          {/* Rating + Distance row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {rating} ({reviews} reviews)
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {distance}
              </Text>
            </View>
          </View>
        </View>

        {/* Price + CTA */}
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, { color: colors.text }]}>
              {formatPay(gig.pay)}
            </Text>
            <Text style={[styles.priceUnit, { color: colors.textSecondary }]}>
              / night
            </Text>
          </View>

          <Pressable
            style={styles.selectButton}
            onPress={() => onPress(gig.id)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${gig.venueName}`}
          >
            <Text style={styles.selectButtonText}>Select</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  pagination: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
    borderRadius: 3,
  },
  infoContainer: {
    paddingTop: 8,
    gap: 8,
  },
  textSection: {
    gap: 2,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 14,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 22,
  },
  selectButton: {
    backgroundColor: '#1B2228',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
