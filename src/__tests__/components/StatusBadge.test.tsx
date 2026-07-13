/**
 * Unit tests for the StatusBadge component and getStatusColor helper.
 */

import { render } from '@testing-library/react-native';

import { getStatusColor, StatusBadge } from '@/components/StatusBadge';
import type { ApplicationStatus } from '@/types';

// ─── getStatusColor ──────────────────────────────────────────────────────────

describe('getStatusColor', () => {
  it('returns orange for pending', () => {
    expect(getStatusColor('pending')).toBe('#FF9500');
  });

  it('returns green for accepted', () => {
    expect(getStatusColor('accepted')).toBe('#34C759');
  });

  it('returns red for declined', () => {
    expect(getStatusColor('declined')).toBe('#FF3B30');
  });

  it('returns neutral gray for an unexpected status value', () => {
    // Cast to ApplicationStatus to simulate an unexpected runtime value
    const unknownStatus = 'unknown' as ApplicationStatus;
    expect(getStatusColor(unknownStatus)).toBe('#8E8E93');
  });
});

// ─── StatusBadge component ───────────────────────────────────────────────────

describe('StatusBadge', () => {
  it('renders capitalized status text for pending', async () => {
    const result = await render(<StatusBadge status="pending" />);
    expect(result.getByText('Pending')).toBeTruthy();
  });

  it('renders capitalized status text for accepted', async () => {
    const result = await render(<StatusBadge status="accepted" />);
    expect(result.getByText('Accepted')).toBeTruthy();
  });

  it('renders capitalized status text for declined', async () => {
    const result = await render(<StatusBadge status="declined" />);
    expect(result.getByText('Declined')).toBeTruthy();
  });

  it('renders nothing when status is not provided', async () => {
    // Simulate undefined/null status at runtime
    const result = await render(<StatusBadge status={undefined as unknown as ApplicationStatus} />);
    expect(result.toJSON()).toBeNull();
  });
});
