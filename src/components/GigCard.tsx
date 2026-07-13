import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { SemanticColors } from '@/constants/theme';
import { formatPay } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Gig } from '@/types';

interface GigCardProps {
  gig: Gig;
  onPress: (gigId: string) => void;
  onFavorite?: (gigId: string) => void;
  isFavorited?: boolean;
  /** Use "large" for the Nearby Gigs carousel (taller cards) */
  variant?: 'default' | 'large';
}

/**
 * GigCard — Rich visual card matching the Figma "Gig 1"/"Gig 2" components.
 *
 * Features a gradient image area, a frosted glass location overlay at the bottom,
 * showing venue name + city. Rounded corners at 30px, drop shadow.
 *
 * `variant="large"` renders a 270x259 card (Nearby Gigs).
 * `variant="default"` renders a 270x150 card (Recommended Gigs).
 */
export function GigCard({
  gig,
  onPress,
  onFavorite,
  isFavorited = false,
  variant = 'default',
}: GigCardProps) {
  const colorScheme = useColorScheme();
  const semantic = SemanticColors[colorScheme];

  const isLarge = variant === 'large';
  const cardHeight = isLarge ? 259 : 150;

  const accessibilityLabel = `${gig.venueName}, ${gig.city}, ${formatPay(gig.pay)}`;

  return (
    <Pressable
      style={[
        styles.card,
        { height: cardHeight },
        Platform.select({
          android: { elevation: 4 },
          default: {
            shadowColor: '#000000',
            shadowOpacity: 0.25,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 4 },
          },
        }),
      ]}
      onPress={() => onPress(gig.id)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Gradient image placeholder */}
      <LinearGradient
        colors={[semantic.cardImageGradientStart, semantic.cardImageGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Yellow/warm glow accent (subtle) */}
      <View style={styles.glowAccent} />

      {/* Location overlay box (frosted glass effect) */}
      <View style={[styles.locationOverlay, isLarge && styles.locationOverlayLarge]}>
        <Text style={styles.locationName} numberOfLines={1}>
          {gig.venueName}
        </Text>
        <Text style={styles.locationCity} numberOfLines={1}>
          {gig.city}, {gig.country}
        </Text>
      </View>

      {/* Favorite button */}
      {onFavorite && (
        <Pressable
          style={styles.favoriteButton}
          onPress={() => onFavorite(gig.id)}
          accessibilityRole="button"
          accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          hitSlop={8}
        >
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorited ? semantic.favorite : '#FFFFFF'}
          />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 270,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  glowAccent: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFFCE4',
    opacity: 0.3,
  },
  locationOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 60,
    backgroundColor: 'rgba(29, 29, 29, 0.4)',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    // Backdrop blur effect (iOS only via native)
  },
  locationOverlayLarge: {
    bottom: 20,
    left: 14,
    right: 40,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 14,
    fontWeight: '400',
    color: '#CAC8C8',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
