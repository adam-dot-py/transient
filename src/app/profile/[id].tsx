import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, SemanticColors, Spacing } from '@/constants/theme';
import { mockMusicianProfiles } from '@/data/mockMusicianProfiles';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { FullMusicianProfile, MusicLink } from '@/types';

/**
 * Public Profile View — read-only screen for hosts reviewing musician profiles.
 *
 * Displays the musician's avatar, display name, bio, location, genre chips,
 * and music links. No edit functionality is provided.
 */
export default function ProfileViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const semantic = SemanticColors[colorScheme];

  const profile: FullMusicianProfile | undefined = mockMusicianProfiles.find(
    (p) => p.id === id
  );

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        </View>
        <View style={styles.notFoundContainer}>
          <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
            Profile not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLinkPress = (link: MusicLink) => {
    Linking.openURL(link.url);
  };

  const platformIcon = (platform: MusicLink['platform']): string => {
    return platform === 'apple_music' ? 'musical-note' : 'play-circle';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={[styles.avatar, { borderColor: colors.border }]}
              accessibilityLabel={`${profile.displayName} avatar`}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: colors.backgroundElement, borderColor: colors.border },
              ]}
            >
              <Ionicons name="person" size={48} color={colors.textSecondary} />
            </View>
          )}
        </View>

        {/* Display Name */}
        <Text style={[styles.displayName, { color: colors.text }]}>
          {profile.displayName}
        </Text>

        {/* Location */}
        {(profile.city || profile.country) && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              {[profile.city, profile.country].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        {/* Bio */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.bioText, { color: colors.text }]}>{profile.bio}</Text>
          </View>
        )}

        {/* Genres */}
        {profile.genres.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Genres</Text>
            <View style={styles.genreChipsContainer}>
              {profile.genres.map((genre) => (
                <View
                  key={genre}
                  style={[styles.genreChip, { backgroundColor: colors.backgroundElement }]}
                >
                  <Text style={[styles.genreChipText, { color: colors.text }]}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Music Links */}
        {profile.musicLinks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Music</Text>
            <View style={styles.linksContainer}>
              {profile.musicLinks.map((link, index) => (
                <Pressable
                  key={`${link.platform}-${index}`}
                  style={[styles.linkRow, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => handleLinkPress(link)}
                  accessibilityLabel={`Open ${link.title}`}
                  accessibilityRole="link"
                >
                  <Ionicons
                    name={platformIcon(link.platform) as 'musical-note' | 'play-circle'}
                    size={20}
                    color={semantic.actionBlue}
                  />
                  <Text
                    style={[styles.linkText, { color: semantic.actionBlue }]}
                    numberOfLines={1}
                  >
                    {link.title}
                  </Text>
                  <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.48,
    lineHeight: 34,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: Spacing.three,
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
  },
  section: {
    width: '100%',
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  genreChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  linksContainer: {
    gap: Spacing.two,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
