# Implementation Plan: Unimplemented User Stories

## Overview

This implementation plan covers the four unimplemented user stories (Social Login, Musician Profile, Gig Creation, Push Notifications), the application management flow, and the Supabase Schema Registry. Tasks are ordered to build foundational layers first (schema, auth) before dependent features (profile, gig creation, notifications).

## Tasks

- [x] 1. Create `src/supabase/` directory with `types.ts` containing TypeScript types for all tables (profiles, musician_profiles, gigs, example_songs, applications, push_tokens, notifications) matching the schema reference in requirements.md
- [x] 2. Create `src/supabase/schema.sql` with complete DDL (CREATE TABLE statements, indexes, unique constraints, RLS policies, storage bucket config)
- [x] 3. Create `src/supabase/client.ts` with Supabase client initialization (mock-friendly, using environment variables) and `src/supabase/README.md` documenting schema conventions
- [x] 4. Update `src/types/index.ts` — add FullMusicianProfile, MusicLink, ExampleSong, Notification, ApplicationWithProfile types; update Gig to support `genres: Genre[]` (array instead of single genre)
- [x] 5. Update `src/data/mockGigs.ts` to use `genres: Genre[]` array format and update `src/data/gigService.ts` and `src/context/GigContext.tsx` to handle multi-genre gigs
- [x] 6. Create `src/data/authService.ts` with pure helper functions: validateEmail, validatePassword (min 8 chars, 1 uppercase, 1 number), isSessionExpired
- [x] 7. Create `src/context/AuthContext.tsx` — AuthProvider with session state, signIn (social + email), signUp, signOut, loading state, user object, and mock auth data for development
- [x] 8. Create `src/app/(auth)/_layout.tsx` (Stack layout for auth screens) and `src/app/(auth)/login.tsx` (Login screen with Apple, Google, Facebook social buttons and email/password form)
- [x] 9. Create `src/app/(auth)/signup.tsx` — Sign-up screen with email/password form, validation feedback, and navigation to login
- [x] 10. Update `src/app/_layout.tsx` — Wrap app in AuthProvider, add auth guard logic (no session → redirect to /(auth)/login, valid session → show /(tabs))
- [x] 11. Create `src/data/profileService.ts` — pure validation functions: validateProfile (display_name required, ≥1 genre), validateBio (≤500 chars), validateMusicLinks (≤10, valid URLs), validateProfileImage (≤5MB, jpeg/png MIME)
- [x] 12. Create `src/data/mockMusicianProfiles.ts` — extended mock data with bio, city, country, genres, music_links for existing mock musicians
- [x] 13. Create `src/context/ProfileContext.tsx` — ProfileProvider with current user's full profile state, updateProfile, uploadAvatar methods
- [x] 14. Create `src/components/GenrePicker.tsx` — reusable multi-select genre chips component (used by both profile and gig creation)
- [x] 15. Create `src/components/AvatarUploader.tsx` — circular avatar display with camera/gallery picker and file validation
- [x] 16. Create `src/components/MusicLinkList.tsx` — list of music links with add/remove, platform icon, URL validation (max 10)
- [x] 17. Rewrite `src/app/(tabs)/profile.tsx` — full profile editor with avatar uploader, bio input, location (city/country), genre picker, music links list, save button with validation
- [x] 18. Create `src/app/profile/[id].tsx` — read-only public profile view for hosts reviewing musician applications
- [x] 19. Write property tests for profileService validation (bio length boundary, music link count invariant, genre selection validity, image file validation)
- [x] 20. Create `src/components/ExampleSongList.tsx` — add/remove song references (title + artist pairs), max 10 items with validation
- [x] 21. Update `src/data/gigService.ts` — extend validateGigInput for multi-genre array validation, add validateExampleSongs (≤10, title/artist required)
- [x] 22. Rewrite `src/app/(tabs)/create.tsx` — full multi-section gig creation form: basic info, location, date/time, genre picker, pay, example songs, push notification toggle, submit button
- [x] 23. Create `src/data/geocodeService.ts` — mock geocoding implementation returning fixed coordinates, interface ready for real geocoding API integration
- [x] 24. Write property tests for extended gig validation (multi-genre requirement, example songs count invariant)
- [x] 25. Create `src/data/applicationService.ts` — pure functions: createApplication (uniqueness check), updateApplicationStatus (valid state transitions only), approveApplication (adds musician to gig), autoDeclinePending, getApplicationsForGig
- [x] 26. Create `src/data/mockApplicationsExtended.ts` — extended mock applications with full musician profile references
- [x] 27. Create `src/context/ApplicationContext.tsx` — ApplicationProvider with submit, approve, deny, list by gig methods
- [x] 28. Create `src/components/ApplicationCard.tsx` — card showing musician name, avatar, genres, bio snippet, status badge
- [x] 29. Create `src/components/ApplicationActions.tsx` — approve/deny buttons for host view, disabled states based on application status
- [x] 30. Create `src/app/gig/[id]/applications.tsx` — applications list screen accessible from gig detail (host view only)
- [x] 31. Update gig detail screen to show "View Applications" button and application count badge for host users
- [x] 32. Write property tests for applicationService (uniqueness enforcement, state transition validity, approval side effects, auto-decline on fill)
- [x] 33. Create `src/data/notificationService.ts` — pure functions: shouldNotifyMusician (genre overlap check), buildNotificationPayload, matchMusiciansForGig
- [x] 34. Create `src/data/mockNotifications.ts` — mock notification data covering types: new_gig, application_approved, application_declined
- [x] 35. Create `src/hooks/useNotifications.ts` — hook for requesting permissions, registering push token, handling incoming notification taps (navigate to gig detail)
- [x] 36. Create `src/context/NotificationContext.tsx` — NotificationProvider with notifications list, unread count, markAsRead, token registration state
- [x] 37. Create `src/components/NotificationCard.tsx` — notification list item with type icon, title, body, timestamp, read/unread styling
- [x] 38. Update `src/app/(tabs)/activity.tsx` — integrate NotificationContext, show notification history alongside applications, real unread badge count
- [x] 39. Update `src/app/(tabs)/_layout.tsx` — wire notification badge to real unread count from NotificationContext
- [x] 40. Write property tests for notificationService (genre matching logic — musician notified iff genres overlap)
- [x] 41. Update `src/app/_layout.tsx` — add ProfileProvider, ApplicationProvider, NotificationProvider to context tree (wrap order: Auth → Role → Profile → Gig → Application → Notification)
- [x] 42. Connect ApplicationContext to GigContext — when application approved, update gig's acceptedMusicianIds; when gig filled, trigger auto-decline of remaining pending applications
- [x] 43. Connect NotificationContext to ApplicationContext — send push notifications on approve/deny decisions
- [x] 44. Write unit tests for authService validation functions (email format, password strength rules)
- [x] 45. End-to-end smoke test: verify login → profile setup → create gig → apply → approve flow works with mock data

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3"] },
    { "id": 1, "tasks": ["4"] },
    { "id": 2, "tasks": ["5", "6", "11", "14", "15", "16", "25", "33"] },
    { "id": 3, "tasks": ["7", "12", "20", "21", "26", "34", "44"] },
    { "id": 4, "tasks": ["8", "9", "13", "22", "23", "24", "27", "35", "40"] },
    { "id": 5, "tasks": ["10", "17", "19", "28", "29", "30", "36"] },
    { "id": 6, "tasks": ["18", "31", "32", "37", "38", "39"] },
    { "id": 7, "tasks": ["41"] },
    { "id": 8, "tasks": ["42", "43"] },
    { "id": 9, "tasks": ["45"] }
  ]
}
```

## Notes

- Development uses local mock data throughout. The Schema Registry (`src/supabase/`) defines the contract but no live Supabase connection is required during development.
- The `genres` field migration (single → array) requires updating existing tests that reference `genre: Genre` to use `genres: Genre[]`.
- Property-based tests use `fast-check` which is already in devDependencies.
- All new screens follow existing conventions: SafeAreaView wrapper, StyleSheet.create at bottom, path aliases (`@/`), default exports for route components.
- The GenrePicker component is shared between profile editing and gig creation to maintain consistency.
