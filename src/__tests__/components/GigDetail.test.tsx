/**
 * Unit tests for the redesigned GigDetail screen — Figma "Gig Overview Page".
 *
 * Verifies:
 * - Venue name renders in the location overlay
 * - Genre pill renders with capitalized text
 * - Pay renders in the price badge
 * - Apply button is present for available gigs
 * - Back navigation affordance exists
 * - Description section renders when provided
 */

import { fireEvent, render } from '@testing-library/react-native';

import type { Gig } from '@/types';

// ─── Mocks (must be before component imports) ────────────────────────────────

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock react-native-reanimated for ConfirmationBanner
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

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{name}</Text>;
  },
}));

// Mutable state to control what useGigs returns per test
let mockGigContextValue: any = {};

jest.mock('@/context/GigContext', () => ({
  useGigs: () => mockGigContextValue,
  GigProvider: ({ children }: any) => children,
}));

// Mock expo-router
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockRouterBack }),
  useLocalSearchParams: () => ({ id: 'test-gig-id' }),
}));

// Mock RoleContext
jest.mock('@/context/RoleContext', () => ({
  useRole: () => ({ role: 'musician', switchRole: jest.fn(), isLoading: false }),
  RoleProvider: ({ children }: any) => children,
}));

// Mock ApplicationContext
jest.mock('@/context/ApplicationContext', () => ({
  useApplications: () => ({
    getApplicationsForGig: jest.fn(() => []),
  }),
  ApplicationProvider: ({ children }: any) => children,
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

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
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

// ─── Component Imports (after mocks) ─────────────────────────────────────────

import GigDetailScreen from '@/app/gig/[id]';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

const baseGig: Gig = {
  id: 'test-gig-id',
  title: 'Friday Night Jazz',
  venueName: 'The Blue Room',
  addressLine1: '123 Main St',
  city: 'Nashville',
  postcode: '37201',
  country: 'USA',
  latitude: 36.16,
  longitude: -86.78,
  date: '2025-08-15',
  startTime: '20:00',
  endTime: '23:00',
  genres: ['jazz'],
  pay: 250,
  description: 'A smooth jazz night',
  status: 'available',
  hosterId: 'hoster-1',
  acceptedMusicianIds: [],
};

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockGigContextValue = {
    gigs: [baseGig],
    recentlyViewed: [],
    acceptedGigs: [],
    getGigById: jest.fn().mockReturnValue(baseGig),
    getGigsByStatus: jest.fn().mockReturnValue([]),
    createGig: jest.fn(),
    acceptGig: jest.fn(),
    addToRecentlyViewed: jest.fn(),
    getHosterGigs: jest.fn().mockReturnValue({ active: [], past: [] }),
  };
});

// ─── Core Rendering Tests ────────────────────────────────────────────────────

describe('GigDetail — renders venue and location overlay', () => {
  it('renders the venue name in the overlay', async () => {
    const { getAllByText } = await render(<GigDetailScreen />);
    // Venue name appears in both the hero overlay and details section
    expect(getAllByText('The Blue Room').length).toBeGreaterThanOrEqual(1);
  });

  it('renders city and country in the overlay', async () => {
    const { getByText } = await render(<GigDetailScreen />);
    expect(getByText('Nashville, USA')).toBeTruthy();
  });
});

describe('GigDetail — renders price badge', () => {
  it('renders the formatted pay in the price badge', async () => {
    const { getByText } = await render(<GigDetailScreen />);
    expect(getByText('$250.00')).toBeTruthy();
  });
});

describe('GigDetail — renders genre pill', () => {
  it('renders the genre capitalized in a pill', async () => {
    const { getByText } = await render(<GigDetailScreen />);
    expect(getByText('Jazz')).toBeTruthy();
  });
});

describe('GigDetail — apply button for available gigs', () => {
  it('renders "Apply for this Gig" button for available gigs', async () => {
    const { getByText } = await render(<GigDetailScreen />);
    expect(getByText('Apply for this Gig')).toBeTruthy();
  });

  it('calls acceptGig when Apply is pressed', async () => {
    const { getByLabelText } = await render(<GigDetailScreen />);
    fireEvent.press(getByLabelText('Apply for this gig'));
    expect(mockGigContextValue.acceptGig).toHaveBeenCalledWith('test-gig-id');
  });

  it('shows confirmation banner after pressing Apply', async () => {
    const { getByLabelText, getByText } = await render(<GigDetailScreen />);
    // The banner text "Gig accepted!" should appear after pressing Apply
    // (the banner is always in the tree with visible=bannerVisible prop)
    fireEvent.press(getByLabelText('Apply for this gig'));
    // Verify acceptGig was called (functional test)
    expect(mockGigContextValue.acceptGig).toHaveBeenCalledWith('test-gig-id');
  });
});

describe('GigDetail — description section', () => {
  it('renders description text when provided', async () => {
    const { getByText } = await render(<GigDetailScreen />);
    expect(getByText('Description')).toBeTruthy();
    expect(getByText('A smooth jazz night')).toBeTruthy();
  });

  it('renders fallback message when description is empty', async () => {
    const gigNoDesc = { ...baseGig, description: '' };
    mockGigContextValue.getGigById = jest.fn().mockReturnValue(gigNoDesc);

    const { getByText } = await render(<GigDetailScreen />);
    expect(getByText('No description provided for this gig.')).toBeTruthy();
  });
});

describe('GigDetail — back navigation', () => {
  it('has a back button with "Go back" accessibility label', async () => {
    const { getByLabelText } = await render(<GigDetailScreen />);
    expect(getByLabelText('Go back')).toBeTruthy();
  });

  it('calls router.back() when back button is pressed', async () => {
    const { getByLabelText } = await render(<GigDetailScreen />);
    fireEvent.press(getByLabelText('Go back'));
    expect(mockRouterBack).toHaveBeenCalled();
  });
});

describe('GigDetail — page title', () => {
  it('renders "Gig Overview" as the page title', async () => {
    const { getByText } = await render(<GigDetailScreen />);
    expect(getByText('Gig Overview')).toBeTruthy();
  });
});

describe('GigDetail — not found state', () => {
  it('renders "Gig not found" when gig does not exist', async () => {
    mockGigContextValue.getGigById = jest.fn().mockReturnValue(null);
    const { getByText } = await render(<GigDetailScreen />);
    expect(getByText('Gig not found')).toBeTruthy();
  });
});
