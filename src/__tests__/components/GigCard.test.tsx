/**
 * Unit tests for the redesigned GigCard component.
 * Updated to match the Figma "Gig 1"/"Gig 2" card design with location overlay.
 */

import { GigCard } from '@/components/GigCard';
import type { Gig } from '@/types';
import { fireEvent, render } from '@testing-library/react-native';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// ─── Test Fixtures ───────────────────────────────────────────────────────────

const baseGig: Gig = {
  id: 'gig-123',
  title: 'Friday Night Jazz at The Blue Room',
  venueName: 'The Blue Room',
  addressLine1: '123 Music Lane',
  city: 'Nashville',
  postcode: '37201',
  country: 'USA',
  latitude: 36.16,
  longitude: -86.78,
  date: '2025-01-15',
  startTime: '20:00',
  endTime: '23:00',
  genres: ['jazz'],
  pay: 250,
  description: 'A smooth jazz night',
  status: 'available',
  hosterId: 'hoster-1',
  acceptedMusicianIds: [],
};

// ─── Rendering Tests ─────────────────────────────────────────────────────────

describe('GigCard — rendering', () => {
  it('renders the venue name in the location overlay', async () => {
    const result = await render(
      <GigCard gig={baseGig} onPress={() => {}} />
    );
    expect(result.getByText('The Blue Room')).toBeTruthy();
  });

  it('renders the city and country in the location overlay', async () => {
    const result = await render(
      <GigCard gig={baseGig} onPress={() => {}} />
    );
    expect(result.getByText('Nashville, USA')).toBeTruthy();
  });

  it('renders correctly with variant="large"', async () => {
    const result = await render(
      <GigCard gig={baseGig} onPress={() => {}} variant="large" />
    );
    expect(result.getByText('The Blue Room')).toBeTruthy();
  });
});

// ─── Interaction Tests ───────────────────────────────────────────────────────

describe('GigCard — interactions', () => {
  it('calls onPress with the gig id when the card is pressed', async () => {
    const onPress = jest.fn();
    const result = await render(
      <GigCard gig={baseGig} onPress={onPress} />
    );
    fireEvent.press(result.getByRole('button'));
    expect(onPress).toHaveBeenCalledWith('gig-123');
  });

  it('calls onFavorite with the gig id when the favorite button is pressed', async () => {
    const onFavorite = jest.fn();
    const result = await render(
      <GigCard gig={baseGig} onPress={() => {}} onFavorite={onFavorite} isFavorited={false} />
    );
    fireEvent.press(result.getByLabelText('Add to favorites'));
    expect(onFavorite).toHaveBeenCalledWith('gig-123');
  });

  it('does not render the favorite button when onFavorite is not provided', async () => {
    const result = await render(
      <GigCard gig={baseGig} onPress={() => {}} />
    );
    expect(result.queryByLabelText('Add to favorites')).toBeNull();
    expect(result.queryByLabelText('Remove from favorites')).toBeNull();
  });

  it('shows "Remove from favorites" label when isFavorited is true', async () => {
    const result = await render(
      <GigCard gig={baseGig} onPress={() => {}} onFavorite={() => {}} isFavorited={true} />
    );
    expect(result.getByLabelText('Remove from favorites')).toBeTruthy();
  });
});

// ─── Accessibility Tests ─────────────────────────────────────────────────────

describe('GigCard — accessibility', () => {
  it('has an accessibilityLabel that includes venue, city, and pay', async () => {
    const result = await render(
      <GigCard gig={baseGig} onPress={() => {}} />
    );
    const card = result.getByRole('button');
    expect(card.props.accessibilityLabel).toContain('The Blue Room');
    expect(card.props.accessibilityLabel).toContain('Nashville');
    expect(card.props.accessibilityLabel).toContain('$250.00');
  });
});
