/**
 * Pure functions for push notification logic.
 *
 * All functions are pure — no side effects, no mutations.
 * They handle genre-based matching, notification payload construction,
 * and filtering musicians who should receive gig notifications.
 */

import type { Genre } from '@/types';

/**
 * Determines whether a musician should be notified about a gig
 * based on genre overlap.
 *
 * Returns true if at least one of the musician's genres overlaps
 * with the gig's required genres. Returns false if either array
 * is empty or there is no overlap.
 */
export function shouldNotifyMusician(
  musicianGenres: Genre[],
  gigGenres: Genre[]
): boolean {
  if (musicianGenres.length === 0 || gigGenres.length === 0) {
    return false;
  }

  return musicianGenres.some((genre) => gigGenres.includes(genre));
}

/**
 * Builds a structured notification payload based on the notification type
 * and gig details.
 *
 * Supported types:
 * - 'new_gig': Notifies a musician about a new matching gig
 * - 'application_approved': Notifies a musician their application was accepted
 * - 'application_declined': Notifies a musician their application was not selected
 */
export function buildNotificationPayload(
  type: 'new_gig' | 'application_approved' | 'application_declined',
  gig: {
    id: string;
    title: string;
    venueName: string;
    date: string;
    pay: number;
    genres: Genre[];
  }
): { title: string; body: string; data: Record<string, string> } {
  switch (type) {
    case 'new_gig':
      return {
        title: 'New Gig Available',
        body: `${gig.title} at ${gig.venueName} on ${gig.date} — £${gig.pay}`,
        data: { gigId: gig.id, type: 'new_gig' },
      };

    case 'application_approved':
      return {
        title: 'Application Approved! 🎉',
        body: `You've been accepted for ${gig.title} at ${gig.venueName}`,
        data: { gigId: gig.id, type: 'application_approved' },
      };

    case 'application_declined':
      return {
        title: 'Application Update',
        body: `Your application for ${gig.title} was not selected this time`,
        data: { gigId: gig.id, type: 'application_declined' },
      };
  }
}

/**
 * Filters a list of musicians to find those whose genres overlap
 * with the gig's required genres.
 *
 * Returns an array of musician IDs that should be notified.
 * Uses `shouldNotifyMusician` internally for the overlap check.
 */
export function matchMusiciansForGig(
  musicians: { id: string; genres: Genre[] }[],
  gigGenres: Genre[]
): string[] {
  return musicians
    .filter((musician) => shouldNotifyMusician(musician.genres, gigGenres))
    .map((musician) => musician.id);
}
