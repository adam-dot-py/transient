/**
 * Unit tests for the ApplicationRow component.
 */

import { fireEvent, render } from '@testing-library/react-native';

import { ApplicationRow } from '@/components/ApplicationRow';
import type { Application } from '@/types';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: any) => (
      <View {...props}>{children}</View>
    ),
  };
});

const mockApplication: Application = {
  id: 'app-1',
  venue: 'The Basement',
  date: '2024-01-15',
  status: 'pending',
  gigId: 'gig-1',
};

describe('ApplicationRow', () => {
  it('renders the venue name', async () => {
    const result = await render(
      <ApplicationRow application={mockApplication} />
    );
    expect(result.getByText('The Basement')).toBeTruthy();
  });

  it('renders the date in short format', async () => {
    const result = await render(
      <ApplicationRow application={mockApplication} />
    );
    // "2024-01-15" should format to "Mon, Jan 15"
    expect(result.getByText('Mon, Jan 15')).toBeTruthy();
  });

  it('renders the StatusBadge with the application status', async () => {
    const result = await render(
      <ApplicationRow application={mockApplication} />
    );
    // StatusBadge capitalizes the status text
    expect(result.getByText('Pending')).toBeTruthy();
  });

  it('calls onPress with the application ID when pressed', async () => {
    const onPress = jest.fn();
    const result = await render(
      <ApplicationRow application={mockApplication} onPress={onPress} />
    );

    const pressable = result.getByRole('button');
    fireEvent.press(pressable);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith('app-1');
  });

  it('does not crash when onPress is not provided', async () => {
    const result = await render(
      <ApplicationRow application={mockApplication} />
    );

    const pressable = result.getByRole('button');
    expect(() => fireEvent.press(pressable)).not.toThrow();
  });

  it('renders accepted status correctly', async () => {
    const acceptedApp: Application = {
      ...mockApplication,
      id: 'app-2',
      status: 'accepted',
    };
    const result = await render(
      <ApplicationRow application={acceptedApp} />
    );
    expect(result.getByText('Accepted')).toBeTruthy();
  });

  it('truncates long venue names to a single line', async () => {
    const longVenueApp: Application = {
      ...mockApplication,
      venue: 'A Very Long Venue Name That Should Be Truncated On A Single Line',
    };
    const result = await render(
      <ApplicationRow application={longVenueApp} />
    );
    const venueText = result.getByText(longVenueApp.venue);
    expect(venueText.props.numberOfLines).toBe(1);
  });
});
