/**
 * Mock notification data for local development.
 *
 * Covers all three notification types: new_gig, application_approved,
 * and application_declined. Uses timestamps from the last few days
 * with a mix of read and unread states.
 */

import type { Notification } from '@/types';

/**
 * Helper to produce an ISO timestamp offset from now by a number of hours.
 * Negative values = past.
 */
function offsetHours(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

/**
 * 6 sample notifications covering:
 * - 2 × new_gig (with gigId in data)
 * - 2 × application_approved (with gigId and applicationId in data)
 * - 2 × application_declined (with gigId and applicationId in data)
 * - Mix of read: true and read: false
 * - All for userId 'mock-user-001'
 */
export const mockNotifications: Notification[] = [
  // ─── new_gig notifications ─────────────────────────────────────────────
  {
    id: 'notif-1',
    userId: 'mock-user-001',
    type: 'new_gig',
    title: 'New Gig Near You',
    body: 'Friday Night Rock Showcase at The Bluebird Cafe — $250',
    data: { gigId: 'gig-1' },
    read: false,
    createdAt: offsetHours(-2),
  },
  {
    id: 'notif-2',
    userId: 'mock-user-001',
    type: 'new_gig',
    title: 'New Gig Near You',
    body: 'Jazz Brunch Session at Rudy\'s Jazz Room — $300',
    data: { gigId: 'gig-2' },
    read: true,
    createdAt: offsetHours(-26),
  },

  // ─── application_approved notifications ─────────────────────────────────
  {
    id: 'notif-3',
    userId: 'mock-user-001',
    type: 'application_approved',
    title: 'Application Approved!',
    body: 'You\'ve been accepted for Blues on Broadway at Robert\'s Western World.',
    data: { gigId: 'gig-5', applicationId: 'app-101' },
    read: false,
    createdAt: offsetHours(-5),
  },
  {
    id: 'notif-4',
    userId: 'mock-user-001',
    type: 'application_approved',
    title: 'Application Approved!',
    body: 'You\'ve been accepted for Pop Cover Band Night at Marathon Music Works.',
    data: { gigId: 'gig-7', applicationId: 'app-102' },
    read: true,
    createdAt: offsetHours(-48),
  },

  // ─── application_declined notifications ─────────────────────────────────
  {
    id: 'notif-5',
    userId: 'mock-user-001',
    type: 'application_declined',
    title: 'Application Declined',
    body: 'Your application for Electronic Night at the Warehouse was not selected.',
    data: { gigId: 'gig-3', applicationId: 'app-103' },
    read: false,
    createdAt: offsetHours(-12),
  },
  {
    id: 'notif-6',
    userId: 'mock-user-001',
    type: 'application_declined',
    title: 'Application Declined',
    body: 'Your application for Classical Ensemble for Private Event was not selected.',
    data: { gigId: 'gig-8', applicationId: 'app-104' },
    read: true,
    createdAt: offsetHours(-72),
  },
];
