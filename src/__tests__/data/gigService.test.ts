/**
 * Unit tests for gigService pure functions.
 * Covers core behaviors and edge cases for each function.
 */

import {
    addToRecentlyViewed,
    createGig,
    filterByStatus,
    formatPay,
    getAllGigs,
    getGigById,
    truncateTitle,
    updateGig,
    validateGigInput,
} from '@/data/gigService';
import type { CreateGigInput, Gig } from '@/types';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

const mockGig: Gig = {
  id: 'gig-1',
  title: 'Test Gig',
  venueName: 'Test Venue',
  addressLine1: '123 Test St',
  city: 'Nashville',
  postcode: '37201',
  country: 'USA',
  latitude: 36.16,
  longitude: -86.78,
  date: '2099-12-31',
  startTime: '20:00',
  endTime: '23:00',
  genres: ['rock'],
  pay: 250,
  description: 'A test gig',
  status: 'available',
  hosterId: 'hoster-1',
  acceptedMusicianIds: [],
};

const mockGigs: Gig[] = [
  mockGig,
  { ...mockGig, id: 'gig-2', status: 'accepted', title: 'Accepted Gig' },
  { ...mockGig, id: 'gig-3', status: 'past', title: 'Past Gig' },
];

function futureDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

const validInput: CreateGigInput = {
  title: 'New Gig',
  venueName: 'Some Venue',
  addressLine1: '456 Music Ave',
  city: 'Austin',
  postcode: '73301',
  country: 'USA',
  date: futureDate(),
  startTime: '19:00',
  endTime: '22:00',
  genres: ['jazz'],
  pay: 300,
};

// ─── getAllGigs ───────────────────────────────────────────────────────────────

describe('getAllGigs', () => {
  it('returns all gigs unchanged', () => {
    expect(getAllGigs(mockGigs)).toEqual(mockGigs);
  });

  it('returns empty array for empty input', () => {
    expect(getAllGigs([])).toEqual([]);
  });
});

// ─── getGigById ──────────────────────────────────────────────────────────────

describe('getGigById', () => {
  it('returns the gig when found', () => {
    expect(getGigById(mockGigs, 'gig-1')).toEqual(mockGig);
  });

  it('returns null for non-existent ID', () => {
    expect(getGigById(mockGigs, 'non-existent')).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(getGigById([], 'gig-1')).toBeNull();
  });
});

// ─── createGig ───────────────────────────────────────────────────────────────

describe('createGig', () => {
  it('creates a gig with valid input', () => {
    const result = createGig([], validInput, 'hoster-1');
    expect('gig' in result).toBe(true);
    if ('gig' in result) {
      expect(result.gig.title).toBe('New Gig');
      expect(result.gig.status).toBe('available');
      expect(result.gig.acceptedMusicianIds).toEqual([]);
      expect(result.gig.hosterId).toBe('hoster-1');
      expect(result.gig.id).toBeDefined();
      expect(result.gigs).toHaveLength(1);
    }
  });

  it('returns ValidationError when required fields are missing', () => {
    const result = createGig([], {} as CreateGigInput, 'hoster-1');
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.type).toBe('validation');
      expect(result.error.fields.title).toBeDefined();
      expect(result.error.fields.venueName).toBeDefined();
    }
  });

  it('does not mutate the original array', () => {
    const original = [...mockGigs];
    createGig(original, validInput, 'hoster-1');
    expect(original).toEqual(mockGigs);
  });
});

// ─── updateGig ───────────────────────────────────────────────────────────────

describe('updateGig', () => {
  it('updates a gig and returns new array', () => {
    const result = updateGig(mockGigs, 'gig-1', { title: 'Updated' });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.gig.title).toBe('Updated');
      expect(result.gigs[0].title).toBe('Updated');
    }
  });

  it('returns null for non-existent ID', () => {
    expect(updateGig(mockGigs, 'non-existent', { title: 'X' })).toBeNull();
  });

  it('does not mutate original array', () => {
    const original = [...mockGigs];
    updateGig(original, 'gig-1', { title: 'Changed' });
    expect(original[0].title).toBe('Test Gig');
  });
});

// ─── filterByStatus ──────────────────────────────────────────────────────────

describe('filterByStatus', () => {
  it('filters gigs by available status', () => {
    const result = filterByStatus(mockGigs, 'available');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('gig-1');
  });

  it('returns empty array when no gigs match', () => {
    expect(filterByStatus([], 'available')).toEqual([]);
  });
});

// ─── addToRecentlyViewed ─────────────────────────────────────────────────────

describe('addToRecentlyViewed', () => {
  it('adds ID to the front of the list', () => {
    const result = addToRecentlyViewed(['a', 'b'], 'c');
    expect(result[0]).toBe('c');
  });

  it('deduplicates existing entries', () => {
    const result = addToRecentlyViewed(['a', 'b', 'c'], 'b');
    expect(result).toEqual(['b', 'a', 'c']);
  });

  it('caps at max (default 20)', () => {
    const list = Array.from({ length: 20 }, (_, i) => `id-${i}`);
    const result = addToRecentlyViewed(list, 'new-id');
    expect(result).toHaveLength(20);
    expect(result[0]).toBe('new-id');
  });

  it('respects custom max', () => {
    const result = addToRecentlyViewed(['a', 'b', 'c'], 'd', 3);
    expect(result).toEqual(['d', 'a', 'b']);
  });

  it('does not mutate original list', () => {
    const original = ['a', 'b'];
    addToRecentlyViewed(original, 'c');
    expect(original).toEqual(['a', 'b']);
  });
});

// ─── validateGigInput ────────────────────────────────────────────────────────

describe('validateGigInput', () => {
  it('returns null for valid input', () => {
    expect(validateGigInput(validInput)).toBeNull();
  });

  it('returns errors for all missing required fields', () => {
    const result = validateGigInput({});
    expect(result).not.toBeNull();
    if (result) {
      expect(result.fields.title).toBeDefined();
      expect(result.fields.venueName).toBeDefined();
      expect(result.fields.addressLine1).toBeDefined();
      expect(result.fields.city).toBeDefined();
      expect(result.fields.postcode).toBeDefined();
      expect(result.fields.country).toBeDefined();
      expect(result.fields.date).toBeDefined();
      expect(result.fields.startTime).toBeDefined();
      expect(result.fields.endTime).toBeDefined();
      expect(result.fields.genres).toBeDefined();
      expect(result.fields.pay).toBeDefined();
    }
  });

  it('rejects end time <= start time', () => {
    const result = validateGigInput({ ...validInput, startTime: '22:00', endTime: '20:00' });
    expect(result?.fields.endTime).toBe('End time must be after start time');
  });

  it('rejects end time equal to start time', () => {
    const result = validateGigInput({ ...validInput, startTime: '20:00', endTime: '20:00' });
    expect(result?.fields.endTime).toBe('End time must be after start time');
  });

  it('rejects past dates', () => {
    const result = validateGigInput({ ...validInput, date: '2020-01-01' });
    expect(result?.fields.date).toBe('Date must be today or in the future');
  });

  it('rejects pay below 1', () => {
    const result = validateGigInput({ ...validInput, pay: 0 });
    expect(result?.fields.pay).toBe('Pay must be between 1 and 99,999');
  });

  it('rejects pay above 99999', () => {
    const result = validateGigInput({ ...validInput, pay: 100000 });
    expect(result?.fields.pay).toBe('Pay must be between 1 and 99,999');
  });

  it('rejects title over 100 characters', () => {
    const longTitle = 'A'.repeat(101);
    const result = validateGigInput({ ...validInput, title: longTitle });
    expect(result?.fields.title).toBe('Title must be 100 characters or fewer');
  });
});

// ─── formatPay ───────────────────────────────────────────────────────────────

describe('formatPay', () => {
  it('formats integer pay with two decimals', () => {
    expect(formatPay(250)).toBe('$250.00');
  });

  it('formats decimal pay correctly', () => {
    expect(formatPay(99.5)).toBe('$99.50');
  });

  it('formats zero', () => {
    expect(formatPay(0)).toBe('$0.00');
  });
});

// ─── truncateTitle ───────────────────────────────────────────────────────────

describe('truncateTitle', () => {
  it('returns short titles unchanged', () => {
    expect(truncateTitle('Short Title')).toBe('Short Title');
  });

  it('truncates titles exceeding default max (40)', () => {
    const longTitle = 'A'.repeat(50);
    const result = truncateTitle(longTitle);
    expect(result).toBe('A'.repeat(40) + '...');
    expect(result.length).toBe(43);
  });

  it('returns title of exactly max length unchanged', () => {
    const exact = 'B'.repeat(40);
    expect(truncateTitle(exact)).toBe(exact);
  });

  it('respects custom max', () => {
    expect(truncateTitle('Hello World', 5)).toBe('Hello...');
  });
});
