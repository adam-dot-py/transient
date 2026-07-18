import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, SemanticColors, Spacing } from '@/constants/theme';
import { formatPay } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Gig } from '@/types';

// Safe import: react-native-maps requires a native build (dev client).
// In Expo Go, it will throw — we catch and render a placeholder instead.
let MapView: any = null;
let Marker: any = null;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
} catch {
  // Maps not available — will render fallback
}

interface GigPushAlertProps {
  /** The gig being pushed to the musician */
  gig: Gig;
  /** Whether the alert is visible */
  visible: boolean;
  /** Called when the musician applies for the gig */
  onApply: (gigId: string) => void;
  /** Called when the musician dismisses the alert */
  onDismiss: () => void;
}

/**
 * GigPushAlert — Full-screen modal that appears when a gig is pushed to
 * a musician. Shows the gig location on a map, key details (price, genre,
 * venue, date/time), and Apply/Dismiss action buttons.
 *
 * This is the "killer feature" — like an Uber ride request popping up,
 * the musician instantly sees what's on offer and can decide to apply.
 */
export function GigPushAlert({ gig, visible, onApply, onDismiss }: GigPushAlertProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const semantic = SemanticColors[scheme];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="musical-notes" size={22} color={semantic.actionBlue} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            New Gig Available
          </Text>
          <Pressable
            onPress={onDismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Map */}
          <View style={styles.mapContainer}>
            {MapView ? (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: gig.latitude,
                  longitude: gig.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                accessibilityLabel="Gig location map"
              >
                {Marker && (
                  <Marker
                    coordinate={{
                      latitude: gig.latitude,
                      longitude: gig.longitude,
                    }}
                    title={gig.venueName}
                  />
                )}
              </MapView>
            ) : (
              <LinearGradient
                colors={[semantic.cardImageGradientStart, semantic.cardImageGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.map}
              >
                <View style={styles.mapFallback}>
                  <Ionicons name="location" size={32} color={colors.textSecondary} />
                  <Text style={[styles.mapFallbackText, { color: colors.textSecondary }]}>
                    {gig.city}, {gig.country}
                  </Text>
                </View>
              </LinearGradient>
            )}
          </View>

          {/* Venue & Location */}
          <View style={styles.venueSection}>
            <Text style={[styles.venueName, { color: colors.text }]}>
              {gig.venueName}
            </Text>
            <Text style={[styles.venueAddress, { color: colors.textSecondary }]}>
              {gig.addressLine1}, {gig.city}
            </Text>
          </View>

          {/* Gig Title */}
          <Text style={[styles.gigTitle, { color: colors.text }]}>
            {gig.title}
          </Text>

          {/* Key Details Row */}
          <View style={styles.detailsCard}>
            {/* Price */}
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: semantic.paymentGreen }]}>
                <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pay</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatPay(gig.pay)}
                </Text>
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: semantic.actionBlue }]}>
                <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {gig.date}
                </Text>
                <Text style={[styles.detailSubvalue, { color: colors.textSecondary }]}>
                  {gig.startTime} – {gig.endTime}
                </Text>
              </View>
            </View>
          </View>

          {/* Genres */}
          <View style={styles.genreSection}>
            <Text style={[styles.genreSectionTitle, { color: colors.textSecondary }]}>
              Genres
            </Text>
            <View style={styles.genreRow}>
              {gig.genres.map((genre) => (
                <View
                  key={genre}
                  style={[styles.genrePill, { backgroundColor: colors.backgroundElement }]}
                >
                  <Text style={[styles.genrePillText, { color: colors.text }]}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description preview */}
          {gig.description ? (
            <View style={styles.descriptionSection}>
              <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>
                About this gig
              </Text>
              <Text
                style={[styles.descriptionText, { color: colors.text }]}
                numberOfLines={3}
              >
                {gig.description}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionBar, { borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.dismissButton, { backgroundColor: colors.backgroundElement }]}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss this gig"
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.dismissButtonText, { color: colors.textSecondary }]}>
              Not Now
            </Text>
          </Pressable>

          <Pressable
            style={[styles.applyButton, { backgroundColor: semantic.actionBlue }]}
            onPress={() => onApply(gig.id)}
            accessibilityRole="button"
            accessibilityLabel="Apply for this gig"
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.applyButtonText}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.four,
    paddingBottom: Spacing.two,
  },
  headerTitle: {
    flex: 1,
    marginLeft: Spacing.two,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  mapContainer: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 3 },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  map: {
    height: 200,
    width: '100%',
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapFallbackText: {
    fontSize: 14,
    fontWeight: '500',
  },
  venueSection: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  venueName: {
    fontSize: 20,
    fontWeight: '700',
  },
  venueAddress: {
    fontSize: 14,
    marginTop: 2,
  },
  gigTitle: {
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  detailsCard: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailSubvalue: {
    fontSize: 13,
    marginTop: 1,
  },
  genreSection: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  genreSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  genrePill: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  genrePillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  descriptionSection: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
