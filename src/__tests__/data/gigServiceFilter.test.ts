/**
 * Unit tests for filterGigsByTimeRange and getStartOfWeek.
 * Validates gig filtering by time range (Requirements 8.1–8.7).
 */

import { filterGigsByTimeRange, getStartOfWeek } from '@/data/gigService';
import type { Gig } from '@/types';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

function makeGig(date: string): Gig {
  return {
    id: `gig-${date}`,
    title: `Gig on ${date}`,
    venueName: 'Test Venue',
    addressLine1: '123 Test St',
    city: 'Nashville',
    postcode: '37201',
    country: 'USA',
    latitude: 36.16,
    longitude: -86.78,
    date,
    startTime: '20:00',
    endTime: '23:00',
    genres: ['rock'],
    pay: 250,
    description: 'A test gig',
    status: 'available',
    hosterId: 'hoster-1',
    acceptedMusicianIds: [],
  };
}

function todayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

// ─── getStartOfWeek ──────────────────────────────────────────────────────────

describe('getStartOfWeek', () => {
  it('returns a Monday', () => {
    const result = getStartOfWeek(new Date('2025-01-15')); // Wednesday
    expect(result.getDay()).toBe(1); // Monday
  });

  it('returns the same date if input is Monday', () => {
    const monday = new Date('2025-01-13'); // Monday
    const result = getStartOfWeek(monday);
    expect(result.getDate()).toBe(13);
    expect(result.getMonth()).toBe(0);
  });

  it('handles Sunday correctly (goes back to previous Monday)', () => {
    const sunday = new Date('2025-01-19'); // Sunday
    const result = getStartOfWeek(sunday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(13); // Previous Monday
  });

  it('returns date with time set to 00:00:00', () => {
    const result = getStartOfWeek(new Date('2025-01-15T14:30:00'));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('returned date is always <= input date', () => {
    const input = new Date('2025-01-18'); // Saturday
    const result = getStartOfWeek(input);
    expect(result.getTime()).toBeLessThanOrEqual(input.getTime());
  });
});

// ─── filterGigsByTimeRange ───────────────────────────────────────────────────

describe('filterGigsByTimeRange', () => {
  describe("filter: 'all'", () => {
    it('returns all gigs unchanged (Req 8.1)', () => {
      const gigs = [makeGig('2025-01-10'), makeGig('2025-06-15'), makeGig('2099-12-31')];
      const result = filterGigsByTimeRange(gigs, 'all');
      expect(result).toEqual(gigs);
      expect(result).toHaveLength(3);
    });

    it('returns empty array for empty input', () => {
      expect(filterGigsByTimeRange([], 'all')).toEqual([]);
    });
  });

  describe("filter: 'today'", () => {
    it('returns only gigs matching today (Req 8.2)', () => {
      const today = todayStr();
      const gigs = [makeGig(today), makeGig('2099-12-31'), makeGig(today)];
      const result = filterGigsByTimeRange(gigs, 'today');
      expect(result).toHaveLength(2);
      expect(result.every((g) => g.date === today)).toBe(true);
    });

    it('returns empty when no gigs match today', () => {
      const gigs = [makeGig('2020-01-01'), makeGig('2099-12-31')];
      const result = filterGigsByTimeRange(gigs, 'today');
      expect(result).toEqual([]);
    });
  });

  describe("filter: 'thisWeek'", () => {
    it('includes gigs within current Mon–Sun range (Req 8.3)', () => {
      const today = new Date();
      const startOfWeek = getStartOfWeek(today);

      // Create gigs for each day of the current week
      const weekGigs: Gig[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        weekGigs.push(makeGig(d.toISOString().split('T')[0]));
      }

      // Add a gig outside this week
      const outsideGig = new Date(startOfWeek);
      outsideGig.setDate(outsideGig.getDate() + 7);
      weekGigs.push(makeGig(outsideGig.toISOString().split('T')[0]));

      const result = filterGigsByTimeRange(weekGigs, 'thisWeek');
      expect(result).toHaveLength(7);
    });
  });

  describe("filter: 'nextWeek'", () => {
    it('includes gigs within next Mon–Sun range (Req 8.4)', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfWeek = getStartOfWeek(today);
      const nextMonday = new Date(startOfWeek);
      nextMonday.setDate(nextMonday.getDate() + 7);

      // Create gigs for each day of next week (Mon–Sun)
      const nextWeekGigs: Gig[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(nextMonday);
        d.setDate(d.getDate() + i);
        nextWeekGigs.push(makeGig(d.toISOString().split('T')[0]));
      }

      // Add a gig two weeks from now (should be excluded)
      const twoWeeksOut = new Date(nextMonday);
      twoWeeksOut.setDate(twoWeeksOut.getDate() + 7);
      nextWeekGigs.push(makeGig(twoWeeksOut.toISOString().split('T')[0]));

      const result = filterGigsByTimeRange(nextWeekGigs, 'nextWeek');
      expect(result).toHaveLength(7);
      // All result gigs should be within the next week range
      result.forEach((g) => {
        const gigDate = new Date(g.date + 'T00:00:00');
        expect(gigDate.getTime()).toBeGreaterThanOrEqual(nextMonday.getTime());
        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextSunday.getDate() + 6);
        expect(gigDate.getTime()).toBeLessThanOrEqual(nextSunday.getTime());
      });
    });

    it('excludes gigs from current week', () => {
      const gigs = [makeGig(todayStr())];
      const result = filterGigsByTimeRange(gigs, 'nextWeek');
      expect(result).toEqual([]);
    });
  });

  describe('general properties', () => {
    it('result is always a subset of input (Req 8.5)', () => {
      const gigs = [makeGig(todayStr()), makeGig(dateStr(7)), makeGig(dateStr(14))];
      const result = filterGigsByTimeRange(gigs, 'today');
      expect(result.length).toBeLessThanOrEqual(gigs.length);
      result.forEach((g) => expect(gigs).toContain(g));
    });

    it('preserves order (Req 8.6)', () => {
      const today = todayStr();
      const gigs = [
        makeGig(today),
        makeGig(today),
        makeGig(today),
      ];
      gigs[0].id = 'first';
      gigs[1].id = 'second';
      gigs[2].id = 'third';

      const result = filterGigsByTimeRange(gigs, 'today');
      expect(result.map((g) => g.id)).toEqual(['first', 'second', 'third']);
    });

    it('returns empty array for invalid filter values (Req 8.7)', () => {
      const gigs = [makeGig(todayStr())];
      // Cast to bypass type checking for testing invalid values
      const result = filterGigsByTimeRange(gigs, 'invalid' as any);
      expect(result).toEqual([]);
    });
  });
});
