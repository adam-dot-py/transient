import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenBackground } from '@/components/ScreenBackground';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useRole } from '@/context/RoleContext';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Profile tab — Hub screen showing the user's profile summary (read-only)
 * with quick links to Edit Profile, Settings, and other actions.
 */
export default function ProfileHubScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const router = useRouter();
  const { profile } = useProfile();
  const { role } = useRole();
  const { signOut } = useAuth();

  const initials = profile?.displayName
    ? profile.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <ScreenBackground>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          {/* Avatar */}
          {profile?.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: Brand.purple + '20' }]}>
              <Text style={[styles.avatarInitials, { color: Brand.purple }]}>{initials}</Text>
            </View>
          )}

          {/* Name & Info */}
          <Text style={[styles.displayName, { color: colors.text }]}>
            {profile?.displayName ?? 'Unknown'}
          </Text>

          {profile?.city && (
            <Text style={[styles.location, { color: colors.textSecondary }]}>
              {profile.city}{profile.country ? `, ${profile.country}` : ''}
            </Text>
          )}

          {/* Role badge */}
          <View style={[styles.roleBadge, { borderColor: Brand.purple + '40' }]}>
            <Ionicons
              name={role === 'musician' ? 'musical-notes' : 'business'}
              size={12}
              color={Brand.purple}
            />
            <Text style={[styles.roleBadgeText, { color: Brand.purple }]}>
              {role === 'musician' ? 'Musician' : 'Host'}
            </Text>
          </View>

          {/* Genres */}
          {profile?.genres && profile.genres.length > 0 && (
            <View style={styles.genreRow}>
              {profile.genres.slice(0, 4).map((genre) => (
                <View key={genre} style={[styles.genrePill, { backgroundColor: colors.backgroundSelected }]}>
                  <Text style={[styles.genrePillText, { color: colors.text }]}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={[styles.menuSection, { borderColor: colors.border }]}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => router.push('/profile/edit')}
            colors={colors}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push('/profile/settings')}
            colors={colors}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="notifications-outline"
            label="Notification Preferences"
            onPress={() => router.push('/profile/settings')}
            colors={colors}
          />
        </View>

        {/* Account section */}
        <View style={[styles.menuSection, { borderColor: colors.border }]}>
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {}}
            colors={colors}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={signOut}
            colors={colors}
            destructive
          />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  colors,
  destructive = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  colors: typeof Colors.light;
  destructive?: boolean;
}) {
  return (
    <Pressable
      style={styles.menuItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={destructive ? '#FF3B30' : colors.text}
      />
      <Text style={[styles.menuItemText, { color: destructive ? '#FF3B30' : colors.text }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: 100,
    gap: Spacing.three,
  },
  profileCard: {
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    justifyContent: 'center',
  },
  genrePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  genrePillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  menuSection: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
});
