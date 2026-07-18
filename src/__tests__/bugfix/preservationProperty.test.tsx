/**
 * Preservation Property Tests — Verifies existing functionality remains unchanged.
 *
 * Updated to match the Figma redesign:
 * - GigDetailScreen now shows "Gig Overview" title, venue in overlay, "Apply" button
 * - HomeScreen filters are "All", "This Week", "Next Week"
 * - HomeScreen sections are "Nearby Gigs" and "Recommended Gigs"
 * - ExploreScreen shows SearchBar with "Nashville, TN" and map
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */

import { fireEvent, render } from '@testing-library/react-native';
import * as fc from 'fast-check';

import type { Genre, Gig, GigStatus } from '@/types';

// ─── Mocks (must be before component imports) ────────────────────────────────

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

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

jest.mock('react-native-maps', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => (
      <View testID="mock-map" {...props}>{children}</View>
    ),
    Marker: ({ title, onPress, ...props }: any) => (
      <View testID={`marker-${title}`} {...props}>
        <Text onPress={onPress}>{title}</Text>
      </View>
    ),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{name}</Text>;
  },
}));

let mockGigContextValue: any = {};

jest.mock('@/context/GigContext', () => ({
  useGigs: () => mockGigContextValue,
  GigProvider: ({ children }: any) => children,
}));

let mockRoleContextValue: any = { role: 'musician', switchRole: jest.fn(), isLoading: false };

jest.mock('@/context/RoleContext', () => ({
  useRole: () => mockRoleContextValue,
  RoleProvider: ({ children }: any) => children,
}));

// Mock ProfileContext
jest.mock('@/context/ProfileContext', () => ({
  useProfile: () => ({
    profile: { displayName: 'Test User', avatarUrl: null, genres: [], musicLinks: [], city: null, country: null },
  }),
}));

// Mock ApplicationContext
jest.mock('@/context/ApplicationContext', () => ({
  useApplications: () => ({
    getApplicationsForGig: jest.fn(() => []),
  }),
  ApplicationProvider: ({ children }: any) => children,
}));

// Mock GigPushContext
jest.mock('@/context/GigPushContext', () => ({
  useGigPush: () => ({
    pushGig: jest.fn(),
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

// Mock datetimepicker
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: (props: any) => <View {...props} /> };
});

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: ({ ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props} />;
  },
}));

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockRouterBack, push: mockRouterPush }),
  useLocalSearchParams: () => ({ id: 'test-gig-id' }),
}));

// ─── Component Imports (after mocks) ─────────────────────────────────────────

import ExploreScreen from '@/app/(tabs)/explore';
import HomeScreen from '@/app/(tabs)/index';
import GigDetailScreen from '@/app/gig/[id]';
import { formatPay } from '@/data/gigService';

// ─── Arbitraries / Generators ─────────────────────────────────────────────────

const GENRES: Genre[] = ['rock', 'jazz', 'blues', 'electronic', 'folk', 'classical', 'pop', 'country'];

const genreArb = fc.constantFrom(...GENRES);
const gigStatusArb = fc.constantFrom<GigStatus>('available', 'accepted', 'past');

const timeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

const dateArb = fc.tuple(
  fc.integer({ min: 2024, max: 2026 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 })
).map(([y, m, d]) => `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`);

const gigArb: fc.Arbitrary<Gig> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  venueName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  addressLine1: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  addressLine2: fc.string({ minLength: 0, maxLength: 100 }),
  city: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  postcode: fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0),
  country: fc.string({ minLength: 1, maxLength: 60 }).filter(s => s.trim().length > 0),
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  date: dateArb,
  startTime: timeArb,
  endTime: timeArb,
  genres: fc.array(genreArb, { minLength: 1, maxLength: 3 }),
  pay: fc.integer({ min: 1, max: 99999 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  status: gigStatusArb,
  hosterId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  acceptedMusicianIds: fc.array(fc.uuid(), { minLength: 0, maxLength: 3 }),
});

const availableGigArb = gigArb.map((g) => ({ ...g, status: 'available' as const }));
const availableGigListArb = fc.array(availableGigArb, { minLength: 1, maxLength: 5 });

const SAMPLE_AVAILABLE_GIGS = fc.sample(availableGigArb, 25);
const SAMPLE_GIG_LISTS = fc.sample(fc.array(gigArb, { minLength: 0, maxLength: 5 }), 10);
const SAMPLE_AVAILABLE_GIG_LISTS = fc.sample(availableGigListArb, 10);

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockRoleContextValue = { role: 'musician', switchRole: jest.fn(), isLoading: false };
  mockGigContextValue = {
    gigs: [],
    recentlyViewed: [],
    acceptedGigs: [],
    getGigById: jest.fn().mockReturnValue(null),
    getGigsByStatus: jest.fn().mockReturnValue([]),
    createGig: jest.fn(),
    acceptGig: jest.fn(),
    addToRecentlyViewed: jest.fn(),
    getHosterGigs: jest.fn().mockReturnValue({ active: [], past: [] }),
  };
});

// ─── GigDetailScreen Preservation Tests ──────────────────────────────────────

describe('Preservation Property: GigDetailScreen renders gig fields correctly', () => {
  /**
   * For all valid gig data, the GigDetailScreen renders
   * venue name, genres (capitalized), pay, and description.
   */
  it.each(SAMPLE_AVAILABLE_GIGS.map((gig, i) => [i, gig]))(
    'renders core gig fields for generated gig #%i',
    async (_index, gig) => {
      mockGigContextValue = {
        ...mockGigContextValue,
        gigs: [gig],
        getGigById: jest.fn().mockReturnValue(gig),
      };

      const { getByText, queryByText, getAllByText } = await render(<GigDetailScreen />);

      // Venue name in overlay
      expect(getByText(gig.venueName)).toBeTruthy();

      // Genre (capitalized) in pill — check first genre
      const capitalizedGenre = gig.genres[0].charAt(0).toUpperCase() + gig.genres[0].slice(1);
      expect(getAllByText(capitalizedGenre).length).toBeGreaterThan(0);

      // Pay in price badge
      expect(getByText(formatPay(gig.pay))).toBeTruthy();

      // Description (if non-empty)
      if (gig.description && gig.description.trim().length > 0) {
        expect(queryByText(gig.description)).toBeTruthy();
      }
    }
  );
});

describe('Preservation Property: GigDetailScreen Apply flow', () => {
  /**
   * For available gigs, the "Apply" button is rendered and triggers acceptance.
   */
  it.each(SAMPLE_AVAILABLE_GIGS.slice(0, 15).map((gig, i) => [i, gig]))(
    'renders Apply button and triggers acceptance for gig #%i',
    async (_index, gig) => {
      const mockAcceptGig = jest.fn();
      mockGigContextValue = {
        ...mockGigContextValue,
        gigs: [gig],
        getGigById: jest.fn().mockReturnValue(gig),
        acceptGig: mockAcceptGig,
      };

      const { getByLabelText } = await render(<GigDetailScreen />);

      // Apply button should be present
      const applyButton = getByLabelText('Apply for this gig');
      expect(applyButton).toBeTruthy();

      // Press it
      fireEvent.press(applyButton);

      // acceptGig should have been called with gig id
      expect(mockAcceptGig).toHaveBeenCalledWith(gig.id);
    }
  );
});

// ─── MusicianDashboard Preservation Tests ────────────────────────────────────

describe('Preservation Property: MusicianDashboard renders correctly', () => {
  /**
   * For any valid gig list, the MusicianDashboard renders SectionTitle("Home"),
   * filter chips, and section headers correctly.
   */
  it.each(SAMPLE_GIG_LISTS.map((gigs, i) => [i, gigs]))(
    'renders SectionTitle "Home", filter chips, and section headers for gig list #%i',
    async (_index, gigs) => {
      mockRoleContextValue = { role: 'musician', switchRole: jest.fn(), isLoading: false };
      mockGigContextValue = {
        ...mockGigContextValue,
        gigs,
        getGigsByStatus: jest.fn().mockReturnValue(gigs.filter((g: Gig) => g.status === 'available')),
      };

      const { getByText, queryByText } = await render(<HomeScreen />);

      // Home screen shows a greeting with user name
      expect(queryByText(/Hi,.*!/)).toBeTruthy();

      // Filter chips (matching Figma: All, This Week, Next Week, This Month)
      expect(getByText('All')).toBeTruthy();
      expect(getByText('This Week')).toBeTruthy();
      expect(getByText('Next Week')).toBeTruthy();
      expect(getByText('This Month')).toBeTruthy();

      // Section headers (matching Figma)
      expect(getByText('Nearby Gigs')).toBeTruthy();
      expect(getByText('Recommended Gigs')).toBeTruthy();
    }
  );
});

// ─── HosterDashboard Preservation Tests ──────────────────────────────────────

describe('Preservation Property: HosterDashboard renders Create Gig button', () => {
  /**
   * For all valid gig lists, the HosterDashboard renders the "Create Gig" button.
   */
  it.each(SAMPLE_GIG_LISTS.map((gigs, i) => [i, gigs]))(
    'always renders Create Gig button for gig list #%i',
    async (_index, gigs) => {
      const activeGigs = gigs.filter((g: Gig) => g.status !== 'past');
      const pastGigs = gigs.filter((g: Gig) => g.status === 'past');

      mockRoleContextValue = { role: 'hoster', switchRole: jest.fn(), isLoading: false };
      mockGigContextValue = {
        ...mockGigContextValue,
        gigs,
        getHosterGigs: jest.fn().mockReturnValue({ active: activeGigs, past: pastGigs }),
      };

      const { getByText, getByLabelText } = await render(<HomeScreen />);

      // Create Gig button must always be present
      const createGigButton = getByLabelText('Create Gig');
      expect(createGigButton).toBeTruthy();

      // Text content
      expect(getByText('+ Create Gig')).toBeTruthy();

      // Press should navigate to /(tabs)/create
      fireEvent.press(createGigButton);
      expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/create');
    }
  );
});

// ─── ExploreScreen Preservation Tests ────────────────────────────────────────

describe('Preservation Property: ExploreScreen renders search and map correctly', () => {
  /**
   * For any list of available gigs, ExploreScreen renders the search bar
   * and the map container.
   */
  it.each(SAMPLE_AVAILABLE_GIG_LISTS.map((gigs, i) => [i, gigs]))(
    'renders search bar and map container for gig list #%i',
    async (_index, gigs) => {
      mockGigContextValue = {
        ...mockGigContextValue,
        gigs,
        getGigsByStatus: jest.fn().mockReturnValue(gigs),
      };

      const { getByText, getByTestId } = await render(<ExploreScreen />);

      // SearchBar shows location
      expect(getByText('Nashville, TN')).toBeTruthy();

      // Map container must be present
      expect(getByTestId('mock-map')).toBeTruthy();

      // Result count shown
      expect(getByText(`${gigs.length} results`)).toBeTruthy();
    }
  );

  /**
   * When no gigs are available, ExploreScreen still renders the search and map.
   */
  it('renders search bar when no available gigs exist', async () => {
    mockGigContextValue = {
      ...mockGigContextValue,
      gigs: [],
      getGigsByStatus: jest.fn().mockReturnValue([]),
    };

    const { getByText } = await render(<ExploreScreen />);

    expect(getByText('Nashville, TN')).toBeTruthy();
    expect(getByText('0 results')).toBeTruthy();
  });
});
