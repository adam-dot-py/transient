import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { Brand, Colors } from '@/constants/theme';
import { useNotificationContext } from '@/context/NotificationContext';
import { useRole } from '@/context/RoleContext';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Tab layout following Apple HIG and Material 3 best practices:
 * - Full-width, fixed to bottom (not floating)
 * - Icon + label for each tab
 * - Brand purple accent on active tab
 * - Clean top border separator
 * - Proper safe area insets handled by the Tabs component
 */
export default function TabLayout() {
  const scheme = useColorScheme();
  const { unreadCount } = useNotificationContext();
  const { role } = useRole();

  const isDark = scheme === 'dark';
  const colors = Colors[scheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.purple,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#141422' : '#FFFFFF',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          height: Platform.select({ ios: 88, android: 68 }),
          paddingTop: 8,
          paddingBottom: Platform.select({ ios: 28, android: 8 }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          href: role === 'musician' ? null : '/(tabs)/create',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#FE2C55',
    fontSize: 10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
  },
});
