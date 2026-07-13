/**
 * Pure functions for managing gig applications.
 *
 * All functions are pure — no side effects, no mutations of input data.
 * They validate state transitions, enforce uniqueness constraints, and
 * return new values for the context/state layer to persist.
 */

import type { ApplicationStatus } from '@/types';

/** A full application record as stored in the applications table */
export interface ApplicationRecord {
  id: string;
  gigId: string;
  musicianId: string;
  status: ApplicationStatus;
  message: string | null;
  createdAt: string;
}

/**
 * Creates a new application for a musician applying to a gig.
 *
 * Enforces uniqueness: a musician cannot apply to the same gig twice.
 * On success, returns the new application with status 'pending'.
 */
export function createApplication(
  applications: ApplicationRecord[],
  gigId: string,
  musicianId: string,
  message?: string
): { success: true; application: ApplicationRecord } | { success: false; error: string } {
  const alreadyApplied = applications.some(
    (a) => a.gigId === gigId && a.musicianId === musicianId
  );

  if (alreadyApplied) {
    return { success: false, error: 'Already applied to this gig' };
  }

  const application: ApplicationRecord = {
    id: crypto.randomUUID(),
    gigId,
    musicianId,
    status: 'pending',
    message: message ?? null,
    createdAt: new Date().toISOString(),
  };

  return { success: true, application };
}

/**
 * Updates the status of an application with valid state transition enforcement.
 *
 * Valid transitions:
 * - pending → accepted
 * - pending → declined
 *
 * Any other current status or target status returns an error.
 */
export function updateApplicationStatus(
  application: ApplicationRecord,
  newStatus: ApplicationStatus
): { isValid: true; application: ApplicationRecord } | { isValid: false; error: string } {
  if (application.status !== 'pending') {
    return { isValid: false, error: 'Can only update pending applications' };
  }

  if (newStatus !== 'accepted' && newStatus !== 'declined') {
    return { isValid: false, error: 'Invalid status transition' };
  }

  return {
    isValid: true,
    application: { ...application, status: newStatus },
  };
}

/**
 * Approves an application: sets status to 'accepted' and adds the musician
 * to the gig's acceptedMusicianIds array (without duplicates).
 *
 * Returns both the updated application and the updated gig data.
 */
export function approveApplication(
  application: ApplicationRecord,
  gig: { acceptedMusicianIds: string[] }
): { application: ApplicationRecord; gig: { acceptedMusicianIds: string[] } } {
  const updatedApplication: ApplicationRecord = {
    ...application,
    status: 'accepted',
  };

  const alreadyAccepted = gig.acceptedMusicianIds.includes(application.musicianId);
  const updatedGig = {
    acceptedMusicianIds: alreadyAccepted
      ? [...gig.acceptedMusicianIds]
      : [...gig.acceptedMusicianIds, application.musicianId],
  };

  return { application: updatedApplication, gig: updatedGig };
}

/**
 * Auto-declines all pending applications for a given gig.
 *
 * Used when a gig is filled (transitions to 'accepted' status) to
 * automatically reject remaining pending applications.
 *
 * Returns the full updated applications array with affected entries
 * set to 'declined'.
 */
export function autoDeclinePending(
  applications: ApplicationRecord[],
  gigId: string
): ApplicationRecord[] {
  return applications.map((a) => {
    if (a.gigId === gigId && a.status === 'pending') {
      return { ...a, status: 'declined' as ApplicationStatus };
    }
    return a;
  });
}

/**
 * Filters and returns only applications matching the given gigId.
 */
export function getApplicationsForGig(
  applications: ApplicationRecord[],
  gigId: string
): ApplicationRecord[] {
  return applications.filter((a) => a.gigId === gigId);
}
