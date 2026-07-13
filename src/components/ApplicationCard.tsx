import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import { Colors, SemanticColors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { ApplicationWithProfile } from '@/types';

export interface ApplicationCardProps {
  application: ApplicationWithProfile;
  onPress?: () => void;
}

/**
 * ApplicationCard — displays a musician's application summary.
 *
 * Shows the musician's display name, circular avatar, first 2–3 genres as chips,
 * bio truncated to 100 characters, and a status badge (pending=yellow,
 * accepted=green, declined=red). The entire card is pressable when onPress
 * is provided.
 */
export default function ApplicationCard({ application, onPress }: ApplicationCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const semantic = SemanticColors[colorScheme];

  const { musician, status } = application;
  const displayGenres = musician.genres.slice(0, 3);
  const bioSnippet =
    musician.bio && musician.bio.length > 100
      ? `${musician.bio.slice(0, 100)}…`
      : musician.bio;

  const content = (
    <View
      style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
      accessibilityRole="summary"
      accessibilityLabel={`Application from ${musician.displayName}, status ${status}`}
    >
      {/* Header: Avatar + Name + Status Badge */}
      <View style={styles.header}>
        {musician.avatarUrl ? (
          <Image source={{ uri: musician.avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: semantic.cardImageGradientStart }]}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
        )}

        <View style={styles.headerText}>
          <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
            {musician.displayName}
          </Text>
        </View>

        <StatusBadge status={status} />
      </View>

      {/* Genre chips */}
      {displayGenres.length > 0 && (
        <View style={styles.genreRow}>
          {displayGenres.map((genre) => (
            <View key={genre} style={[styles.genreChip, { backgroundColor: colors.backgroundSelected }]}>
              <Text style={[styles.genreText, { color: colors.textSecondary }]}>
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Bio snippet */}
      {bioSnippet && (
        <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
          {bioSnippet}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.two,
    marginRight: Spacing.two,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  genreChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 8,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.two,
  },
});
