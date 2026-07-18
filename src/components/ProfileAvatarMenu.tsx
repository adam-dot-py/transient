import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

import { Brand, Colors } from '@/constants/theme';
import { useProfile } from '@/context/ProfileContext';
import { useColorScheme } from '@/hooks/useColorScheme';

const AVATAR_SIZE = 38;

/**
 * ProfileAvatarMenu — A circular profile avatar that opens a floating
 * menu overlay to the right when tapped. Does NOT push layout.
 *
 * The expanded menu uses position: absolute so it floats over content.
 */
export function ProfileAvatarMenu() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const router = useRouter();
  const { profile } = useProfile();
  const [expanded, setExpanded] = useState(false);

  const initials = profile?.displayName
    ? profile.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  const handleToggle = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  const navigateTo = useCallback((route: string) => {
    setExpanded(false);
    router.push(route as any);
  }, [router]);

  return (
    <View style={styles.wrapper}>
      {/* Avatar Button — always visible, fixed size */}
      <Pressable
        onPress={handleToggle}
        style={styles.avatarButton}
        accessibilityRole="button"
        accessibilityLabel="Open profile menu"
      >
        {profile?.avatarUrl ? (
          <Image
            source={{ uri: profile.avatarUrl }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: Brand.purple + '20' }]}>
            <Text style={[styles.initialsText, { color: Brand.purple }]}>
              {initials}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Expanded menu — floats absolutely, doesn't push layout */}
      {expanded && (
        <>
          {/* Backdrop to close on tap outside */}
          <Pressable style={styles.backdrop} onPress={() => setExpanded(false)} />
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={[styles.menu, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          >
            <Pressable
              style={styles.menuItem}
              onPress={() => navigateTo('/(tabs)/profile')}
              accessibilityRole="button"
            >
              <Ionicons name="person-outline" size={16} color={Brand.purple} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Profile</Text>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable
              style={styles.menuItem}
              onPress={() => navigateTo('/(tabs)/activity')}
              accessibilityRole="button"
            >
              <Ionicons name="notifications-outline" size={16} color={Brand.purple} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Activity</Text>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable
              style={styles.menuItem}
              onPress={() => navigateTo('/profile/settings')}
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={16} color={Brand.purple} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
            </Pressable>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    zIndex: 100,
  },
  avatarButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  backdrop: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -500,
    bottom: -500,
    zIndex: 98,
  },
  menu: {
    position: 'absolute',
    top: AVATAR_SIZE + 6,
    left: 0,
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 99,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
});
