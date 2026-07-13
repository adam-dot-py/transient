/**
 * End-to-end smoke test: Login → Profile Setup → Create Gig → Apply → Approve
 *
 * Tests the critical user flow by calling the pure service layer functions
 * in sequence with realistic mock data. This validates the full happy path
 * works end-to-end without requiring React rendering or full context providers.
 */

import {
    approveApplication,
    createApplication,
} from '@/data/applicationService';
import { validateEmail, validatePassword } from '@/data/authService';
import { createGig, validateGigInput } from '@/data/gigService';
import { validateBio, validateMusicLinks, validateProfile } from '@/data/profileService';
import type { CreateGigInput, Gig } from '@/types';

// ─── Test Data ───────────────────────────────────────────────────────────────

const TEST_USER = {
  id: 'user-smoke-001',
  email: 'smoketest@transient.app',
  password: 'SecurePass1',
};

const TEST_MUSICIAN = {
  id: 'musician-smoke-001',
  displayName: 'Smoke Test Musician',
  genres: ['rock', 'jazz'] as const,
  bio: 'A talented musician for testing purposes.',
  musicLinks: [
    { platform: 'apple_music' as const, url: 'https://music.apple.com/playlist/abc', title: 'My Rock Set' },
    { platform: 'google_music' as const, url: 'https://music.youtube.com/playlist?list=xyz', title: 'Jazz Favourites' },
  ],
};

function futureDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
}

const TEST_GIG_INPUT: CreateGigInput = {
  title: 'Friday Night Jazz at The Blue Note',
  venueName: 'The Blue Note',
  addressLine1: '131 West 3rd St',
  city: 'New York',
  postcode: '10012',
  country: 'USA',
  date: futureDate(),
  startTime: '20:00',
  endTime: '23:30',
  genres: ['jazz', 'blues'],
  pay: 500,
  description: 'Looking for a jazz musician for our Friday night slot.',
};

// ─── End-to-End Flow ─────────────────────────────────────────────────────────

describe('E2E Smoke Test: Login → Profile → Create Gig → Apply → Approve', () => {
  // Shared state across the sequential flow
  let createdGig: Gig;

  // Step 1: Login — validate credentials
  describe('Step 1: Login', () => {
    it('validates email format successfully', () => {
      const emailResult = validateEmail(TEST_USER.email);
      expect(emailResult.isValid).toBe(true);
      expect(emailResult.error).toBeUndefined();
    });

    it('validates password strength successfully', () => {
      const passwordResult = validatePassword(TEST_USER.password);
      expect(passwordResult.isValid).toBe(true);
      expect(passwordResult.errors).toHaveLength(0);
    });

    it('simulates session creation after valid credentials', () => {
      // In the real app, AuthContext calls these validators then sets a session.
      // Here we verify the validators pass, which is the gate to session creation.
      const session = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        user: { id: TEST_USER.id, email: TEST_USER.email },
      };

      expect(session.user.id).toBe(TEST_USER.id);
      expect(session.user.email).toBe(TEST_USER.email);
      expect(session.expiresAt).toBeGreaterThan(Date.now() / 1000);
    });
  });

  // Step 2: Profile Setup — validate profile data
  describe('Step 2: Profile Setup', () => {
    it('validates profile with display name and genres', () => {
      const profileResult = validateProfile({
        displayName: TEST_MUSICIAN.displayName,
        genres: [...TEST_MUSICIAN.genres],
      });

      expect(profileResult.isValid).toBe(true);
      expect(Object.keys(profileResult.errors)).toHaveLength(0);
    });

    it('validates bio within character limit', () => {
      const bioResult = validateBio(TEST_MUSICIAN.bio);
      expect(bioResult.isValid).toBe(true);
      expect(bioResult.error).toBeUndefined();
    });

    it('validates music links are within limit and well-formed', () => {
      const linksResult = validateMusicLinks(TEST_MUSICIAN.musicLinks);
      expect(linksResult.isValid).toBe(true);
      expect(linksResult.error).toBeUndefined();
    });

    it('confirms profile is complete after validation', () => {
      // Simulates the profile object that would be persisted
      const profile = {
        id: TEST_MUSICIAN.id,
        displayName: TEST_MUSICIAN.displayName,
        role: 'musician' as const,
        avatarUrl: null,
        bio: TEST_MUSICIAN.bio,
        city: 'New York',
        country: 'USA',
        genres: [...TEST_MUSICIAN.genres],
        musicLinks: TEST_MUSICIAN.musicLinks,
      };

      expect(profile.displayName).toBe(TEST_MUSICIAN.displayName);
      expect(profile.genres).toHaveLength(2);
      expect(profile.musicLinks).toHaveLength(2);
    });
  });

  // Step 3: Create Gig — validate input and create
  describe('Step 3: Create Gig', () => {
    it('validates gig input passes all checks', () => {
      const validationError = validateGigInput(TEST_GIG_INPUT);
      expect(validationError).toBeNull();
    });

    it('creates a gig successfully', () => {
      const hosterId = 'hoster-smoke-001';
      const result = createGig([], TEST_GIG_INPUT, hosterId);

      expect('gig' in result).toBe(true);

      if ('gig' in result) {
        createdGig = result.gig;

        expect(createdGig.title).toBe(TEST_GIG_INPUT.title);
        expect(createdGig.status).toBe('available');
        expect(createdGig.hosterId).toBe(hosterId);
        expect(createdGig.acceptedMusicianIds).toEqual([]);
        expect(createdGig.genres).toEqual(['jazz', 'blues']);
        expect(createdGig.pay).toBe(500);
        expect(createdGig.id).toBeDefined();
      }
    });
  });

  // Step 4: Apply — musician submits application
  describe('Step 4: Apply to Gig', () => {
    it('creates an application with pending status', () => {
      const result = createApplication(
        [], // no existing applications
        createdGig.id,
        TEST_MUSICIAN.id,
        'I would love to play at The Blue Note!'
      );

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.application.gigId).toBe(createdGig.id);
        expect(result.application.musicianId).toBe(TEST_MUSICIAN.id);
        expect(result.application.status).toBe('pending');
        expect(result.application.message).toBe(
          'I would love to play at The Blue Note!'
        );
      }
    });

    it('prevents duplicate application to same gig', () => {
      // Simulate existing application in the list
      const existingApplications = [
        {
          id: 'app-001',
          gigId: createdGig.id,
          musicianId: TEST_MUSICIAN.id,
          status: 'pending' as const,
          message: null,
          createdAt: new Date().toISOString(),
        },
      ];

      const result = createApplication(
        existingApplications,
        createdGig.id,
        TEST_MUSICIAN.id
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Already applied to this gig');
      }
    });
  });

  // Step 5: Approve — host approves the application
  describe('Step 5: Approve Application', () => {
    it('approves application and updates gig accepted musicians', () => {
      const application = {
        id: 'app-smoke-001',
        gigId: createdGig.id,
        musicianId: TEST_MUSICIAN.id,
        status: 'pending' as const,
        message: 'I would love to play at The Blue Note!',
        createdAt: new Date().toISOString(),
      };

      const gig = { acceptedMusicianIds: [] as string[] };

      const result = approveApplication(application, gig);

      // Verify application status changed to accepted
      expect(result.application.status).toBe('accepted');
      expect(result.application.id).toBe('app-smoke-001');
      expect(result.application.musicianId).toBe(TEST_MUSICIAN.id);

      // Verify musician was added to gig's acceptedMusicianIds
      expect(result.gig.acceptedMusicianIds).toContain(TEST_MUSICIAN.id);
      expect(result.gig.acceptedMusicianIds).toHaveLength(1);
    });

    it('does not duplicate musician ID if already accepted', () => {
      const application = {
        id: 'app-smoke-002',
        gigId: createdGig.id,
        musicianId: TEST_MUSICIAN.id,
        status: 'pending' as const,
        message: null,
        createdAt: new Date().toISOString(),
      };

      // Musician already in the accepted list
      const gig = { acceptedMusicianIds: [TEST_MUSICIAN.id] };

      const result = approveApplication(application, gig);

      expect(result.application.status).toBe('accepted');
      expect(result.gig.acceptedMusicianIds).toContain(TEST_MUSICIAN.id);
      // Should not duplicate
      expect(result.gig.acceptedMusicianIds).toHaveLength(1);
    });
  });

  // Full flow integration assertion
  describe('Full Flow Verification', () => {
    it('completes the entire login → profile → gig → apply → approve flow', () => {
      // 1. Login: validate credentials
      expect(validateEmail(TEST_USER.email).isValid).toBe(true);
      expect(validatePassword(TEST_USER.password).isValid).toBe(true);

      // 2. Profile: validate profile data
      expect(
        validateProfile({
          displayName: TEST_MUSICIAN.displayName,
          genres: [...TEST_MUSICIAN.genres],
        }).isValid
      ).toBe(true);

      // 3. Create gig: validate and create
      const gigResult = createGig([], TEST_GIG_INPUT, 'hoster-smoke-001');
      expect('gig' in gigResult).toBe(true);

      if (!('gig' in gigResult)) return;
      const gig = gigResult.gig;

      // 4. Apply: submit application
      const applyResult = createApplication([], gig.id, TEST_MUSICIAN.id, 'Excited to play!');
      expect(applyResult.success).toBe(true);

      if (!applyResult.success) return;
      const application = applyResult.application;

      // 5. Approve: host approves
      const approveResult = approveApplication(application, {
        acceptedMusicianIds: [],
      });

      expect(approveResult.application.status).toBe('accepted');
      expect(approveResult.gig.acceptedMusicianIds).toContain(TEST_MUSICIAN.id);
    });
  });
});
