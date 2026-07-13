import { Application } from '@/types';

/**
 * Mock application data for the Activity tab.
 * Each entry represents a musician's application to a gig,
 * covering the three possible statuses: pending, accepted, and declined.
 */
export const MOCK_APPLICATIONS: Application[] = [
  { id: '1', venue: 'The Basement', date: 'Nov 14, 9:00 PM', status: 'pending' },
  { id: '2', venue: 'Jazz Corner', date: 'Nov 13, 8:00 PM', status: 'accepted' },
  { id: '3', venue: 'Open Mic Night', date: 'Nov 12, 7:30 PM', status: 'declined' },
];
