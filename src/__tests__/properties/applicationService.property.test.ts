/**
 * Property-based tests for applicationService.
 *
 * Properties tested:
 * - Property 4: Application uniqueness (same gigId + musicianId pair cannot apply twice)
 * - Property 5: State transition validity (pending→accepted or pending→declined only)
 * - Property 6: Approval side effects (musicianId added without removing others)
 * - Property 7: Auto-decline on gig fill (all pending apps for a gig set to declined)
 */

import type { ApplicationRecord } from '@/data/applicationService';
import {
    approveApplication,
    autoDeclinePending,
    createApplication,
    updateApplicationStatus,
} from '@/data/applicationService';
import type { ApplicationStatus } from '@/types';
import fc from 'fast-check';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Arbitrary for a valid ApplicationRecord */
const applicationRecordArb = (
  overrides?: Partial<ApplicationRecord>
): fc.Arbitrary<ApplicationRecord> =>
  fc.record({
    id: fc.uuid(),
    gigId: overrides?.gigId ? fc.constant(overrides.gigId) : fc.uuid(),
    musicianId: overrides?.musicianId ? fc.constant(overrides.musicianId) : fc.uuid(),
    status: overrides?.status
      ? fc.constant(overrides.status)
      : fc.constantFrom('pending' as const, 'accepted' as const, 'declined' as const),
    message: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 100 })),
    createdAt: fc.constant(new Date().toISOString()),
  });

/** Arbitrary for a pending ApplicationRecord */
const pendingApplicationArb: fc.Arbitrary<ApplicationRecord> = applicationRecordArb({
  status: 'pending',
});

/** Arbitrary for a non-pending ApplicationRecord */
const nonPendingApplicationArb: fc.Arbitrary<ApplicationRecord> = fc.record({
  id: fc.uuid(),
  gigId: fc.uuid(),
  musicianId: fc.uuid(),
  status: fc.constantFrom('accepted' as const, 'declined' as const),
  message: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 100 })),
  createdAt: fc.constant(new Date().toISOString()),
});

/** Arbitrary for an array of unique musician IDs */
const musicianIdsArb = fc.array(fc.uuid(), { minLength: 0, maxLength: 5 });

// ─── Property 4: Application Uniqueness ──────────────────────────────────────

describe('Property 4: Application Uniqueness', () => {
  /**
   * **Validates: Requirements 5.6**
   *
   * For any (gigId, musicianId) pair, the application service prevents
   * creation of a second application when one already exists.
   */
  it('createApplication fails if same (gigId, musicianId) pair already exists', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), (gigId, musicianId) => {
        // Create existing applications with at least one matching the pair
        const existingApp: ApplicationRecord = {
          id: 'existing-id',
          gigId,
          musicianId,
          status: 'pending',
          message: null,
          createdAt: new Date().toISOString(),
        };

        const result = createApplication([existingApp], gigId, musicianId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Already applied to this gig');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('createApplication succeeds when no matching (gigId, musicianId) pair exists', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.array(applicationRecordArb(), { minLength: 0, maxLength: 5 }),
        (gigId, musicianId, existingApps) => {
          // Filter out any that happen to match the pair we're testing
          const filteredApps = existingApps.filter(
            (a) => !(a.gigId === gigId && a.musicianId === musicianId)
          );

          const result = createApplication(filteredApps, gigId, musicianId);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.application.gigId).toBe(gigId);
            expect(result.application.musicianId).toBe(musicianId);
            expect(result.application.status).toBe('pending');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('uniqueness is based on the combination not individual fields', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), fc.uuid(), (gigId, musicianId1, musicianId2) => {
        // Skip when the two musicians are the same
        fc.pre(musicianId1 !== musicianId2);

        const existingApp: ApplicationRecord = {
          id: 'existing-id',
          gigId,
          musicianId: musicianId1,
          status: 'pending',
          message: null,
          createdAt: new Date().toISOString(),
        };

        // Same gig, different musician → should succeed
        const result = createApplication([existingApp], gigId, musicianId2);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 5: State Transition Validity ───────────────────────────────────

describe('Property 5: State Transition Validity', () => {
  /**
   * **Validates: Requirements 5.4, 5.5**
   *
   * An application can only transition: pending → accepted, or pending → declined.
   * No other transitions are valid.
   */
  it('updateApplicationStatus succeeds only for pending → accepted or pending → declined', () => {
    const allStatuses: ApplicationStatus[] = ['pending', 'accepted', 'declined'];

    fc.assert(
      fc.property(
        applicationRecordArb(),
        fc.constantFrom(...allStatuses),
        (application, newStatus) => {
          const result = updateApplicationStatus(application, newStatus);

          const shouldBeValid =
            application.status === 'pending' &&
            (newStatus === 'accepted' || newStatus === 'declined');

          expect(result.isValid).toBe(shouldBeValid);

          if (result.isValid) {
            expect(result.application.status).toBe(newStatus);
            expect(result.application.id).toBe(application.id);
            expect(result.application.gigId).toBe(application.gigId);
            expect(result.application.musicianId).toBe(application.musicianId);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('non-pending applications always fail regardless of target status', () => {
    fc.assert(
      fc.property(
        nonPendingApplicationArb,
        fc.constantFrom('pending' as const, 'accepted' as const, 'declined' as const),
        (application, newStatus) => {
          const result = updateApplicationStatus(application, newStatus);
          expect(result.isValid).toBe(false);
          if (!result.isValid) {
            expect(result.error).toBe('Can only update pending applications');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('pending → pending is not a valid transition', () => {
    fc.assert(
      fc.property(pendingApplicationArb, (application) => {
        const result = updateApplicationStatus(application, 'pending');
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBe('Invalid status transition');
        }
      }),
      { numRuns: 50 }
    );
  });
});

// ─── Property 6: Approval Side Effects ───────────────────────────────────────

describe('Property 6: Approval Side Effects', () => {
  /**
   * **Validates: Requirements 5.4**
   *
   * When an application is approved, the musician's ID is always added to the
   * gig's acceptedMusicianIds array, and no other musician IDs are removed.
   */
  it('approveApplication always adds musicianId and preserves existing IDs', () => {
    fc.assert(
      fc.property(
        pendingApplicationArb,
        musicianIdsArb,
        (application, existingIds) => {
          const gig = { acceptedMusicianIds: existingIds };

          const result = approveApplication(application, gig);

          // musicianId is present in the result
          expect(result.gig.acceptedMusicianIds).toContain(application.musicianId);

          // All previously accepted musicians are still present
          for (const existingId of existingIds) {
            expect(result.gig.acceptedMusicianIds).toContain(existingId);
          }

          // Application status is set to accepted
          expect(result.application.status).toBe('accepted');
        }
      ),
      { numRuns: 200 }
    );
  });

  it('approveApplication does not duplicate musicianId if already present', () => {
    fc.assert(
      fc.property(pendingApplicationArb, musicianIdsArb, (application, otherIds) => {
        // Include the musician's ID in the existing array
        const existingIds = [...otherIds, application.musicianId];
        const gig = { acceptedMusicianIds: existingIds };

        const result = approveApplication(application, gig);

        // Count occurrences of the musicianId
        const count = result.gig.acceptedMusicianIds.filter(
          (id) => id === application.musicianId
        ).length;
        expect(count).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('approveApplication result has superset relationship with original IDs', () => {
    fc.assert(
      fc.property(pendingApplicationArb, musicianIdsArb, (application, existingIds) => {
        const gig = { acceptedMusicianIds: existingIds };

        const result = approveApplication(application, gig);

        // The result is a superset of the original (no IDs removed)
        const resultSet = new Set(result.gig.acceptedMusicianIds);
        for (const id of existingIds) {
          expect(resultSet.has(id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 7: Auto-Decline on Gig Fill ───────────────────────────────────

describe('Property 7: Auto-Decline on Gig Fill', () => {
  /**
   * **Validates: Requirements 5.7**
   *
   * When a gig is filled, all remaining pending applications for that gig
   * have their status set to 'declined', and applications for other gigs
   * or with non-pending status are left unchanged.
   */
  it('autoDeclinePending sets all pending apps for the gig to declined', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(applicationRecordArb(), { minLength: 1, maxLength: 10 }),
        (targetGigId, applications) => {
          // Ensure at least one pending application for this gig
          const pendingForGig: ApplicationRecord = {
            id: 'forced-pending',
            gigId: targetGigId,
            musicianId: 'forced-musician',
            status: 'pending',
            message: null,
            createdAt: new Date().toISOString(),
          };
          const allApps = [...applications, pendingForGig];

          const result = autoDeclinePending(allApps, targetGigId);

          // All apps for the target gig that were pending are now declined
          for (const app of result) {
            if (app.gigId === targetGigId) {
              expect(app.status).not.toBe('pending');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('autoDeclinePending leaves apps for other gigs unchanged', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.array(applicationRecordArb(), { minLength: 0, maxLength: 5 }),
        (targetGigId, otherGigId, otherApps) => {
          fc.pre(targetGigId !== otherGigId);

          // Create apps for other gig with various statuses
          const appsForOtherGig = otherApps.map((a) => ({
            ...a,
            gigId: otherGigId,
          }));

          const result = autoDeclinePending(appsForOtherGig, targetGigId);

          // Apps for other gigs should be unchanged
          for (let i = 0; i < result.length; i++) {
            expect(result[i].status).toBe(appsForOtherGig[i].status);
            expect(result[i].gigId).toBe(otherGigId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('autoDeclinePending leaves already accepted/declined apps for the target gig unchanged', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(nonPendingApplicationArb, { minLength: 1, maxLength: 5 }),
        (targetGigId, nonPendingApps) => {
          // All apps are for the target gig but non-pending
          const appsForGig = nonPendingApps.map((a) => ({
            ...a,
            gigId: targetGigId,
          }));

          const result = autoDeclinePending(appsForGig, targetGigId);

          // Non-pending apps should remain with their original status
          for (let i = 0; i < result.length; i++) {
            expect(result[i].status).toBe(appsForGig[i].status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('autoDeclinePending returns the same number of applications', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(applicationRecordArb(), { minLength: 0, maxLength: 10 }),
        (targetGigId, applications) => {
          const result = autoDeclinePending(applications, targetGigId);
          expect(result.length).toBe(applications.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
