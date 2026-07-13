/**
 * Bug Condition Exploration Tests
 *
 * Validates core navigation and structural behavior after the Figma redesign.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import { render } from '@testing-library/react-native';
import React from 'react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock expo-router
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'gig-1' }),
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{name}</Text>;
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  return {
    default: { createAnimatedComponent: (c: any) => c },
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
    runOnJS: (fn: any) => fn,
    View,
    Text,
    Animated: { View, Text },
  };
});

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = ({ children, ...props }: any) => (
    <View testID="mock-map" {...props}>{children}</View>
  );
  const MockMarker = ({ children, ...props }: any) => (
    <View {...props}>{children}</View>
  );
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

// ─── Providers ───────────────────────────────────────────────────────────────

import { GigProvider } from '@/context/GigContext';
import { RoleContext } from '@/context/RoleContext';
import type { UserRole } from '@/types';

function TestProviders({
  children,
  role = 'musician',
}: {
  children: React.ReactNode;
  role?: UserRole;
}) {
  return (
    <RoleContext.Provider
      value={{ role, switchRole: jest.fn(), isLoading: false }}
    >
      <GigProvider>{children}</GigProvider>
    </RoleContext.Provider>
  );
}

// ─── Component Imports ───────────────────────────────────────────────────────

import ExploreScreen from '@/app/(tabs)/explore';
import HomeScreen from '@/app/(tabs)/index';
import GigDetailScreen from '@/app/gig/[id]';

// ─── Test 1a: GigDetailScreen back button ────────────────────────────────────

describe('Bug Condition Exploration', () => {
  describe('Test 1a: GigDetailScreen back navigation affordance', () => {
    it('should have a back button/pressable in the happy-path (gig found) view', async () => {
      const result = await render(
        <TestProviders>
          <GigDetailScreen />
        </TestProviders>
      );

      const backButton = result.queryByLabelText('Go back');
      expect(backButton).not.toBeNull();
    });
  });

  // ─── Test 1b: ExploreScreen SafeAreaView ─────────────────────────────────

  describe('Test 1b: ExploreScreen SafeAreaView root container', () => {
    it('should use SafeAreaView from react-native-safe-area-context as root container', async () => {
      const result = await render(
        <TestProviders>
          <ExploreScreen />
        </TestProviders>
      );

      const rootElement = result.toJSON();
      const rootType =
        rootElement && !Array.isArray(rootElement) ? rootElement.type : null;

      // SafeAreaView from react-native-safe-area-context renders as
      // "RNCSafeAreaView" in the test renderer.
      expect(rootType).toBe('RNCSafeAreaView');
    });
  });

  // ─── Test 1c: HosterDashboard SectionTitle ───────────────────────────────

  describe('Test 1c: HosterDashboard SectionTitle with "Home" text', () => {
    it('should render SectionTitle component with "Home" text when role is hoster', async () => {
      const result = await render(
        <TestProviders role="hoster">
          <HomeScreen />
        </TestProviders>
      );

      // SectionTitle renders a heading with the sectionName text
      const homeTitle = result.queryByText('Home');
      expect(homeTitle).not.toBeNull();
    });
  });
});
