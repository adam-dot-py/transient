import {
    buildNotificationPayload,
    matchMusiciansForGig,
    shouldNotifyMusician,
} from '@/data/notificationService';
import type { Genre } from '@/types';

describe('notificationService', () => {
  describe('shouldNotifyMusician', () => {
    it('returns true when there is genre overlap', () => {
      const musicianGenres: Genre[] = ['rock', 'jazz'];
      const gigGenres: Genre[] = ['jazz', 'blues'];
      expect(shouldNotifyMusician(musicianGenres, gigGenres)).toBe(true);
    });

    it('returns false when there is no genre overlap', () => {
      const musicianGenres: Genre[] = ['rock', 'folk'];
      const gigGenres: Genre[] = ['jazz', 'blues'];
      expect(shouldNotifyMusician(musicianGenres, gigGenres)).toBe(false);
    });

    it('returns false when musician genres is empty', () => {
      expect(shouldNotifyMusician([], ['rock'])).toBe(false);
    });

    it('returns false when gig genres is empty', () => {
      expect(shouldNotifyMusician(['rock'], [])).toBe(false);
    });

    it('returns false when both arrays are empty', () => {
      expect(shouldNotifyMusician([], [])).toBe(false);
    });
  });

  describe('buildNotificationPayload', () => {
    const gig = {
      id: 'gig-123',
      title: 'Friday Jazz Night',
      venueName: 'Blue Note',
      date: '2025-08-15',
      pay: 150,
      genres: ['jazz'] as Genre[],
    };

    it('builds new_gig payload correctly', () => {
      const result = buildNotificationPayload('new_gig', gig);
      expect(result.title).toBe('New Gig Available');
      expect(result.body).toBe(
        'Friday Jazz Night at Blue Note on 2025-08-15 — £150'
      );
      expect(result.data).toEqual({ gigId: 'gig-123', type: 'new_gig' });
    });

    it('builds application_approved payload correctly', () => {
      const result = buildNotificationPayload('application_approved', gig);
      expect(result.title).toBe('Application Approved! 🎉');
      expect(result.body).toBe(
        "You've been accepted for Friday Jazz Night at Blue Note"
      );
      expect(result.data).toEqual({
        gigId: 'gig-123',
        type: 'application_approved',
      });
    });

    it('builds application_declined payload correctly', () => {
      const result = buildNotificationPayload('application_declined', gig);
      expect(result.title).toBe('Application Update');
      expect(result.body).toBe(
        'Your application for Friday Jazz Night was not selected this time'
      );
      expect(result.data).toEqual({
        gigId: 'gig-123',
        type: 'application_declined',
      });
    });
  });

  describe('matchMusiciansForGig', () => {
    const musicians = [
      { id: 'musician-1', genres: ['rock', 'jazz'] as Genre[] },
      { id: 'musician-2', genres: ['blues', 'folk'] as Genre[] },
      { id: 'musician-3', genres: ['jazz', 'classical'] as Genre[] },
      { id: 'musician-4', genres: ['electronic'] as Genre[] },
    ];

    it('returns IDs of musicians with genre overlap', () => {
      const result = matchMusiciansForGig(musicians, ['jazz']);
      expect(result).toEqual(['musician-1', 'musician-3']);
    });

    it('returns empty array when no musicians match', () => {
      const result = matchMusiciansForGig(musicians, ['country']);
      expect(result).toEqual([]);
    });

    it('returns empty array when gig genres is empty', () => {
      const result = matchMusiciansForGig(musicians, []);
      expect(result).toEqual([]);
    });

    it('returns empty array when musicians array is empty', () => {
      const result = matchMusiciansForGig([], ['rock']);
      expect(result).toEqual([]);
    });

    it('matches multiple genres correctly', () => {
      const result = matchMusiciansForGig(musicians, ['blues', 'electronic']);
      expect(result).toEqual(['musician-2', 'musician-4']);
    });
  });
});
