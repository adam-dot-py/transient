# Implementation Plan: Initial Build

## Overview

This plan implements the Transient app's foundational architecture: tab navigation, role-based dashboards with gig carousels, map view, gig detail/creation screens, role switching with persistence, and a local mock data layer. Tasks are ordered to build from data layer up through UI, ensuring no orphaned code at any step.

## Tasks

- [x] 1. Set up types, theme constants, and project infrastructure
  - [x] 1.1 Create shared TypeScript interfaces and types
    - Create `src/types/index.ts` with all core types: `UserRole`, `GigStatus`, `Genre`, `Gig`, `CreateGigInput`, `ValidationError`, `MusicianProfile`, `HosterProfile`, `UserProfile`, `MapRegion`, and `STORAGE_KEYS`
    - _Requirements: 8.1, 8.3, 8.4, 8.6_

  - [x] 1.2 Set up theme constants and hooks
    - Copy theme tokens from `example/src/constants/theme.ts` to `src/constants/theme.ts`
    - Create `src/hooks/useThemeColor.ts` that returns a themed color value based on the current color scheme
    - Create `src/hooks/useColorScheme.ts` that detects the system color scheme using React Native's `useColorScheme()` and defaults to dark if no preference is set
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 1.3 Install required dependencies
    - Add `@react-native-async-storage/async-storage`, `react-native-maps`, `fast-check` (dev), `jest` and `@testing-library/react-native` (dev) to `package.json`
    - Run `npm install`
    - _Requirements: 7.4, 4.1, 10.2_

- [x] 2. Implement mock data layer and service functions
  - [x] 2.1 Create mock gig data
    - Create `src/data/mockGigs.ts` with 10+ sample gigs covering at least 5 genres, 5 venues, dates spanning past and future, statuses including at least 2 available, 2 accepted, 2 past gigs, geographic coordinates, and all required Gig fields
    - Include a mocked user location (lat/lng for a city center)
    - _Requirements: 8.1, 8.4_

  - [x] 2.2 Create mock profile data
    - Create `src/data/mockProfiles.ts` with 3 musician profiles and 2 hoster profiles, each with unique ID, display name, and role
    - _Requirements: 8.2_

  - [x] 2.3 Implement gigService pure functions
    - Create `src/data/gigService.ts` with: `getAllGigs`, `getGigById`, `createGig`, `updateGig`, `filterByStatus`, `addToRecentlyViewed`, `validateGigInput`, `formatPay`, `truncateTitle`
    - `getGigById` returns `null` for non-existent IDs
    - `createGig` returns `ValidationError` when required fields are missing
    - `validateGigInput` checks: required fields, end time > start time, date not in past, pay between 1–99999, title max 100 chars
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 5.4, 5.5, 5.6_

  - [ ]* 2.4 Write property tests for gigService (Properties 1–3)
    - **Property 1: Carousel item count invariant** — slicing any gig array to max 20 never exceeds 20 items
    - **Property 2: Display formatting invariants** — truncateTitle and formatPay produce correct output for all valid inputs
    - **Property 3: Recently viewed bounded list** — addToRecentlyViewed never exceeds max length, most recent at front
    - **Validates: Requirements 2.2, 2.4, 3.2**

  - [ ]* 2.5 Write property tests for gigService (Properties 4–7)
    - **Property 4: Gig acceptance state transition** — acceptGig moves gig from available to accepted filter sets
    - **Property 5: Status filter completeness and correctness** — filterByStatus returns exactly matching gigs
    - **Property 6: Gig CRUD round-trip** — createGig then getGigById returns matching fields
    - **Property 7: Validation rejects missing required fields** — validateGigInput errors for each missing field
    - **Validates: Requirements 3.4, 4.2, 8.4, 5.3, 8.3, 5.4, 8.6**

  - [ ]* 2.6 Write property tests for gigService (Properties 8–11)
    - **Property 8: Time validation rejects invalid ranges** — endTime ≤ startTime produces validation error
    - **Property 9: Date validation rejects past dates** — past date produces validation error
    - **Property 10: Gig date partitioning** — active/past split is disjoint and complete
    - **Property 11: Role toggle is its own inverse** — double toggle returns to original role
    - **Validates: Requirements 5.5, 5.6, 6.1, 7.2, 7.4**

- [x] 3. Checkpoint - Core data layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement context providers
  - [x] 4.1 Create RoleContext provider
    - Create `src/context/RoleContext.tsx` with `RoleContext`, `RoleProvider`, and `useRole` hook
    - On mount, read persisted role from AsyncStorage; default to 'musician' if not found or on error
    - `switchRole` toggles between musician/hoster, persists to AsyncStorage, and exposes `isLoading` state
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.2 Create GigContext provider
    - Create `src/context/GigContext.tsx` with `GigContext`, `GigProvider`, and `useGigs` hook
    - Initialize state from mock data, expose: `gigs`, `recentlyViewed`, `acceptedGigs`, `getGigById`, `getGigsByStatus`, `createGig`, `acceptGig`, `addToRecentlyViewed`, `getHosterGigs`
    - `addToRecentlyViewed` caps list at 20 items, most recent first
    - `acceptGig` moves gig to accepted status and adds current user to `acceptedMusicianIds`
    - `getHosterGigs` partitions by date into active (future) and past (elapsed)
    - _Requirements: 2.1, 2.2, 3.2, 3.4, 6.1, 8.3, 8.4_

  - [ ]* 4.3 Write unit tests for RoleContext
    - Test: default role is musician, switching toggles role, persistence reads/writes correctly, handles AsyncStorage errors gracefully
    - _Requirements: 7.2, 7.4, 7.5_

  - [ ]* 4.4 Write unit tests for GigContext
    - Test: initial state from mock data, acceptGig state transition, recently viewed cap at 20, createGig with valid/invalid input, getHosterGigs date partitioning
    - _Requirements: 2.1, 3.2, 3.4, 5.3, 6.1_

- [x] 5. Implement tab navigation and root layout
  - [x] 5.1 Update root layout with providers
    - Update `src/app/_layout.tsx` to wrap the app with `RoleProvider` and `GigProvider`
    - Apply theme detection via `useColorScheme` to set status bar style
    - _Requirements: 9.2, 7.5_

  - [x] 5.2 Create tab navigator layout
    - Create `src/app/(tabs)/_layout.tsx` with bottom tab bar: Home (index), Explore, Profile
    - Configure active/inactive tab colors using theme tokens
    - Set Home as the default tab
    - Tab bar remains visible on all tab screens
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 5.3 Create placeholder tab screens
    - Create `src/app/(tabs)/index.tsx` (Home), `src/app/(tabs)/explore.tsx` (Explore), `src/app/(tabs)/profile.tsx` (Profile) with minimal themed content
    - Remove the old `src/app/index.tsx` if the tab layout handles routing
    - _Requirements: 1.1, 1.4_

- [x] 6. Implement shared UI components
  - [x] 6.1 Create ThemedView and base components
    - Create `src/components/ThemedView.tsx` — a View wrapper that applies theme background color
    - Create `src/components/EmptyState.tsx` — displays a message when a section has no content
    - Create `src/components/ConfirmationBanner.tsx` — animated banner that slides in and auto-dismisses after configurable duration (default 3000ms)
    - _Requirements: 9.3, 2.6, 3.4_

  - [x] 6.2 Create GigCard component
    - Create `src/components/GigCard.tsx` with musician and hoster variants
    - Musician variant: truncated title (40 chars + ellipsis), venue name, short date format, formatted pay
    - Hoster variant: title, date, accepted musician count
    - Apply `backgroundElement` token for card border/elevation (min elevation 2 on Android, min 1px border on iOS/web)
    - Handle `onPress` to navigate to appropriate gig detail screen
    - _Requirements: 2.4, 6.2, 9.4_

  - [x] 6.3 Create Carousel component
    - Create `src/components/Carousel.tsx` — horizontal FlatList with section title, max 20 items rendered, shows EmptyState when data array is empty
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

  - [x] 6.4 Create RoleSwitcher component
    - Create `src/components/RoleSwitcher.tsx` — displays current role label with toggle button, calls `switchRole` from RoleContext on press
    - _Requirements: 7.1, 7.2_

  - [ ]* 6.5 Write unit tests for GigCard and Carousel
    - Test: GigCard renders correct fields per variant, title truncation, Carousel limits to 20 items, empty state rendered when no data
    - _Requirements: 2.2, 2.4, 2.6, 6.2_

- [x] 7. Checkpoint - Navigation and components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement dashboard screens (Home tab)
  - [x] 8.1 Implement musician dashboard
    - Update `src/app/(tabs)/index.tsx` to check current role from RoleContext
    - When role is musician: render three Carousels — "Latest Gigs Near You" (available gigs), "Recently Viewed", "Accepted / Upcoming"
    - Each carousel uses GigCard (musician variant) and navigates to `gig/[id]` on press
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 8.2 Implement hoster dashboard
    - When role is hoster: render two Carousels — "Active Gigs" (future date) and "Past Gigs" (elapsed date)
    - Display a "Create Gig" button/action that navigates to `gig/create`
    - Each carousel uses GigCard (hoster variant) and navigates to `gig/hoster/[id]` on press
    - Dashboard updates within 300ms when role changes
    - _Requirements: 5.1, 6.1, 6.2, 6.4, 7.3_

- [x] 9. Implement gig detail screens
  - [x] 9.1 Implement musician gig detail screen
    - Create `src/app/gig/[id].tsx` showing: title, venue name, full address, date, start time, end time, genre, pay (currency formatted), description
    - On mount, call `addToRecentlyViewed` with the gig ID
    - Show "Accept Gig" button if gig status is available; on tap, call `acceptGig`, show ConfirmationBanner for 3 seconds, replace button with disabled "Accepted" indicator
    - If gig already accepted, show disabled "Accepted" indicator
    - If gig not found, show "Gig not found" message with back navigation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 9.2 Implement hoster gig detail screen
    - Create `src/app/gig/hoster/[id].tsx` showing: title, venue name, address, date, start time, end time, genre, pay, description, and list of musicians who accepted
    - If gig not found, show "Gig not found" message with back navigation
    - _Requirements: 6.3_

  - [x] 9.3 Implement create gig form
    - Create `src/app/gig/create.tsx` with controlled form inputs for all required fields (title, venue name, address, date, start time, end time, genre from predefined list, pay) and optional description
    - Apply character limits: title 100, venue name 100, address 200, description 500
    - On submit: run `validateGigInput`, if errors show inline validation messages below each invalid field, if valid call `createGig`, show success confirmation for 3+ seconds, navigate back to hoster dashboard
    - Validate: end time > start time, date not in past, pay 1–99999, required fields present
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 10. Implement map view (Explore tab)
  - [x] 10.1 Create platform-adaptive MapView components
    - Create `src/components/MapView.tsx` for mobile using `react-native-maps` with markers for available gigs at their coordinates, centered on mocked user location with pan/zoom support
    - Create `src/components/MapView.web.tsx` showing a "Map view is not available on web" message with a list fallback of available gigs
    - _Requirements: 4.1, 10.2, 10.3_

  - [x] 10.2 Create GigMarkerPopup component
    - Create `src/components/GigMarkerPopup.tsx` — summary popup showing gig title, venue, date, pay; dismisses previous popup when a new marker is tapped; tapping popup navigates to gig detail
    - _Requirements: 4.3, 4.4_

  - [x] 10.3 Implement Explore screen
    - Update `src/app/(tabs)/explore.tsx` to render MapView with available gigs from GigContext
    - Wire marker press to show GigMarkerPopup, popup press to navigate to `gig/[id]`
    - Show error message if map fails to load (error boundary)
    - Show "No gigs currently available" if no available gigs exist
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 11. Implement profile screen and role switching
  - [x] 11.1 Implement Profile tab with role switcher
    - Update `src/app/(tabs)/profile.tsx` to display current user info and the RoleSwitcher component
    - On role switch, navigate to Home tab and update dashboard within 300ms
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 12. Checkpoint - Full feature integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Cross-platform and theme polish
  - [x] 13.1 Ensure cross-platform rendering and theme compliance
    - Verify all screens use only theme tokens from Colors, Fonts, and Spacing constants (no hardcoded colors/fonts/spacing)
    - Ensure color scheme updates without app restart when system preference changes (use `useColorScheme` reactively)
    - Verify no overlapping UI elements, no text truncation issues, all interactive elements reachable on viewports 320px+ wide
    - Show inline "feature unavailable" messages for missing platform features without crashing
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 10.1, 10.3, 10.4_

  - [ ]* 13.2 Write integration tests for key flows
    - Test: tab navigation between all three tabs, role switch updates dashboard content, create gig flow end-to-end, gig detail adds to recently viewed, accept gig updates carousels
    - _Requirements: 1.2, 2.1, 3.2, 3.4, 5.3, 7.3_

- [x] 14. Final checkpoint - All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design (11 total)
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout — all implementation uses `.ts`/`.tsx` files
- Theme tokens from `example/src/constants/theme.ts` should be copied to `src/constants/theme.ts` early so all components can reference them
- The mock data layer is intentionally pure (no API calls) to support fast property-based testing

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5", "2.6", "4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3"] },
    { "id": 6, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 7, "tasks": ["6.5", "8.1", "8.2"] },
    { "id": 8, "tasks": ["9.1", "9.2", "9.3", "10.1", "10.2"] },
    { "id": 9, "tasks": ["10.3", "11.1"] },
    { "id": 10, "tasks": ["13.1", "13.2"] }
  ]
}
```
