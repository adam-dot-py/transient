/**
 * Unit tests for the Create Gig form address fields.
 * Validates: Requirements 2.1, 2.2, 2.3, 2.6
 *
 * Verifies that the 5 structured address inputs are rendered with correct
 * maxLength props, required indicators, and optional labelling.
 */

import CreateGigScreen from '@/app/gig/create';
import { render } from '@testing-library/react-native';

// Mock react-native-reanimated (required by ConfirmationBanner)
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: any) => <View {...props} />,
    },
    useSharedValue: (val: any) => ({ value: val }),
    useAnimatedStyle: () => ({}),
    withTiming: (val: any) => val,
    runOnJS: (fn: any) => fn,
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock GigContext
jest.mock('@/context/GigContext', () => ({
  useGigs: () => ({
    createGig: jest.fn(() => ({ id: 'new-gig' })),
  }),
}));

// Mock GigPushContext
jest.mock('@/context/GigPushContext', () => ({
  useGigPush: () => ({
    pushGig: jest.fn(),
  }),
}));

// Mock ProfileContext
jest.mock('@/context/ProfileContext', () => ({
  useProfile: () => ({
    profile: { displayName: 'Test', avatarUrl: null, genres: [], musicLinks: [] },
  }),
}));

// Mock useColorScheme
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

// Mock datetimepicker
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: (props: any) => <View {...props} /> };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: ({ ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props} />;
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{name}</Text>;
  },
}));

// ─── Address Field Rendering Tests ───────────────────────────────────────────

describe('CreateGigScreen — address field rendering', () => {
  it('renders all 5 address inputs', async () => {
    const result = await render(<CreateGigScreen />);

    expect(result.getByLabelText('Address Line 1')).toBeTruthy();
    expect(result.getByLabelText('Address Line 2')).toBeTruthy();
    expect(result.getByLabelText('City')).toBeTruthy();
    expect(result.getByLabelText('Postcode')).toBeTruthy();
    expect(result.getByLabelText('Country')).toBeTruthy();
  });

  it('sets maxLength 100 on Address Line 1', async () => {
    const result = await render(<CreateGigScreen />);
    const input = result.getByLabelText('Address Line 1');
    expect(input.props.maxLength).toBe(100);
  });

  it('sets maxLength 100 on Address Line 2', async () => {
    const result = await render(<CreateGigScreen />);
    const input = result.getByLabelText('Address Line 2');
    expect(input.props.maxLength).toBe(100);
  });

  it('sets maxLength 50 on City', async () => {
    const result = await render(<CreateGigScreen />);
    const input = result.getByLabelText('City');
    expect(input.props.maxLength).toBe(50);
  });

  it('sets maxLength 15 on Postcode', async () => {
    const result = await render(<CreateGigScreen />);
    const input = result.getByLabelText('Postcode');
    expect(input.props.maxLength).toBe(15);
  });

  it('sets maxLength 60 on Country', async () => {
    const result = await render(<CreateGigScreen />);
    const input = result.getByLabelText('Country');
    expect(input.props.maxLength).toBe(60);
  });
});

// ─── Required Indicator Tests ────────────────────────────────────────────────

describe('CreateGigScreen — required indicators', () => {
  it('shows "*" required indicator on Address Line 1 label', async () => {
    const result = await render(<CreateGigScreen />);
    expect(result.getByText('Address Line 1 *')).toBeTruthy();
  });

  it('shows "*" required indicator on City label', async () => {
    const result = await render(<CreateGigScreen />);
    expect(result.getByText('City *')).toBeTruthy();
  });

  it('shows "*" required indicator on Postcode label', async () => {
    const result = await render(<CreateGigScreen />);
    expect(result.getByText('Postcode *')).toBeTruthy();
  });

  it('shows "*" required indicator on Country label', async () => {
    const result = await render(<CreateGigScreen />);
    expect(result.getByText('Country *')).toBeTruthy();
  });
});

// ─── Optional Label Tests ────────────────────────────────────────────────────

describe('CreateGigScreen — optional field labelling', () => {
  it('shows "(optional)" in the Address Line 2 label', async () => {
    const result = await render(<CreateGigScreen />);
    expect(result.getByText('Address Line 2 (optional)')).toBeTruthy();
  });

  it('does not show "*" required indicator on Address Line 2 label', async () => {
    const result = await render(<CreateGigScreen />);
    expect(result.queryByText('Address Line 2 *')).toBeNull();
  });
});
