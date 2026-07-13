import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useNotificationContext } from '@/context/NotificationContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const scheme = useColorScheme();
  const { unreadCount } = useNotificationContext();

  const activeColor = Colors[scheme].text;
  const inactiveColor = Colors[scheme].textSecondary;
  const backgroundColor = Colors[scheme].background;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: [styles.tabBar, { backgroundColor }],
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <SymbolView name="house.fill" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <SymbolView name="magnifyingglass" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }) => (
            <SymbolView name="plus.circle.fill" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Notifications',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: styles.tabBarBadge,
          tabBarIcon: ({ color }) => (
            <SymbolView name="bell.fill" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <View style={[styles.profileIcon, { borderColor: color }]}>
              <SymbolView name="person.fill" tintColor={color} size={16} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 0,
    height: 78,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabBarBadge: {
    backgroundColor: '#FE2C55',
    fontSize: 10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
  },
  profileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#D9D9D9',
  },
});
