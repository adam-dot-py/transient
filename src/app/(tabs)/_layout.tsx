import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import GlassTabBar from '@/components/navigation/GlassTabBar';
import { Brand, Colors } from '@/constants/theme';
import { useNotificationContext } from '@/context/NotificationContext';
import { useRole } from '@/context/RoleContext';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Tab layout. The visible bar is rendered by {@link GlassTabBar}, a floating,
 * capability-gated bar following Apple's iOS 26 "Liquid Glass" HIG:
 *  - a floating pill that hovers above content (real glass on iOS 26+),
 *  - a clean opaque fallback everywhere else and under Reduce Transparency,
 *  - brand-purple active accent, icon + label, and badges preserved.
 * Screen config (icons, labels, badges, hidden routes) stays here; only the
 * surface/rendering moved into the custom `tabBar` renderer.
 */
export default function TabLayout() {
  const scheme = useColorScheme();
  const { unreadCount } = useNotificationContext();
  const { role } = useRole();

  const colors = Colors[scheme];

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: Brand.purple,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
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
