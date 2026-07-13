# Implementation Plan: SwiftUI Alignment

## Overview

This plan implements the SwiftUI reference alignment for the Transient app. Work flows from data layer additions (types, theme tokens, filtering logic, mock data) up through shared UI components, then screen-level integration, and finally tab navigation restructuring. Each task builds incrementally so there's no orphaned code.

## Tasks

- [x] 1. Data layer and theme foundations
  - [x] 1.1 Add Application, ApplicationStatus, and GigFilter types to the types module
    - Add `ApplicationStatus` type as union of `'pending' | 'accepted' | 'declined'`
    - Add `GigFilter` type as union of `'all' | 'today' | 'thisWeek' | 'nextWeek'`
    - Add `Application` interface with fields: id, venue, date, status, optional gigId
    - Export all three from `src/types/index.ts`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 1.2 Add SemanticColors to the theme constants module
    - Add `SemanticColors` object with light and dark variants to `src/constants/theme.ts`
    - Include tokens: favorite, statusPending, statusAccepted, statusDeclined, paymentGreen, actionBlue
    - Include gradient tokens: gradientStart, gradientEnd, cardImageGradientStart, cardImageGradientEnd, ultraThinMaterial
    - Export as named export alongside existing Colors, Fonts, Spacing
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 1.3 Implement filterGigsByTimeRange and getStartOfWeek in gigService
    - Add `getStartOfWeek(date: Date): Date` helper that returns Monday 00:00 of the week containing date
    - Add `filterGigsByTimeRange(gigs: Gig[], filter: GigFilter): Gig[]` implementing all four filter cases
    - 'all' returns full array, 'today' matches current date, 'thisWeek' current Mon–Sun, 'nextWeek' next Mon–Sun
    - Return empty array for invalid filter values
    - Export both functions from `src/data/gigService.ts`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 1.4 Write property tests for filterGigsByTimeRange
    - **Property 1: Filter subset invariant** — output is always a subset of input, output length ≤ input length
    - **Property 2: Filter 'all' identity** — output has same length and elements as input
    - **Property 3: Filter date correctness** — every gig in result has date within the specified range
    - **Property 4: Filter order preservation** — relative order in output matches input
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
    - Use fast-check library with arbitrary Gig generators

  - [x] 1.5 Create mock applications data module
    - Create `src/data/mockApplications.ts` with `MOCK_APPLICATIONS` array
    - Include at least 3 applications with different statuses (pending, accepted, declined)
    - Export the array as a named export
    - _Requirements: 9.3, 13.1_

- [x] 2. Shared UI components — small building blocks
  - [x] 2.1 Create StatusBadge component
    - Create `src/components/StatusBadge.tsx`
    - Accept `status: ApplicationStatus` prop
    - Render capsule shape with horizontal padding 10, vertical padding 5
    - Text: 11pt, semibold, white, capitalized status value
    - Background: orange (#FF9500) for pending, green (#34C759) for accepted, red (#FF3B30) for declined
    - Fall back to neutral gray for unexpected status values
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 16.2_

  - [ ]* 2.2 Write property test for getStatusColor
    - **Property 5: Status color totality and correctness** — for every valid ApplicationStatus, returns the correct non-empty hex string
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.6**

  - [x] 2.3 Create FilterChip component
    - Create `src/components/FilterChip.tsx`
    - Accept props: title (string), isSelected (boolean), onPress callback
    - Capsule shape with border radius = half height
    - Selected: white text, semibold, blue accent background
    - Unselected: theme text color, regular weight, backgroundElement background
    - Horizontal padding 16, vertical padding 8, minimum touch target 44px height
    - Set accessibilityRole="button" and accessibility label to title
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 2.4 Create SectionTitle component
    - Create `src/components/SectionTitle.tsx`
    - Accept props: sectionName (string), onProfilePress callback
    - Render title: 34pt, bold (700), theme text color
    - Render circular avatar: 40×40 on trailing edge, min tap target 44×44
    - Horizontal row layout with center vertical alignment
    - Horizontal padding 20, top padding 8, bottom padding 4
    - Truncate title with ellipsis if too long
    - Avatar pressable with accessibility label "Profile"
    - Handle press as no-op if navigation unavailable
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 16.4_

  - [x] 2.5 Create SectionHeader component
    - Create `src/components/SectionHeader.tsx`
    - Accept props: title (string), actionTitle (optional string), onAction (optional callback)
    - Title: 20px, semibold (600), theme text color
    - Action button: 15px, blue color, trailing edge, min tap target 44×44
    - Horizontal row layout with Spacing.three (16) horizontal padding
    - Render only title if no actionTitle provided
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Complex components — GigCard redesign and ApplicationRow
  - [x] 4.1 Redesign GigCard component
    - Rewrite `src/components/GigCard.tsx` with new interface: gig, onPress, onFavorite, isFavorited
    - Fixed width 280px
    - Image area: 280×140px with blue-to-purple linear gradient (0.3 opacity) placeholder
    - Favorite heart icon button: top-right of image, 44×44 tap target, circular background at 0.5 opacity
    - Venue name: bold 16px, 1 line limit with ellipsis
    - Date: 12px, textSecondary, calendar icon prefix
    - Payment: 12px, paymentGreen color, banknote icon prefix, formatted as currency
    - Genre chips: max 2 shown as capsule badges on backgroundElement, "+N" label for overflow
    - Card: 12px rounded corners, platform-appropriate elevation/shadow
    - accessibilityLabel includes venue, date, and pay
    - Handle empty/undefined genres array gracefully
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 15.1, 15.2, 15.3, 16.3_

  - [ ]* 4.2 Write property test for genre truncation
    - **Property 6: Genre truncation bound and order** — output has at most max items, taken from start of input in order; if input ≤ max, output equals input
    - **Validates: Requirements 15.1, 15.2, 15.3, 7.8**
    - Add truncateGenres helper function to gigService and test it

  - [x] 4.3 Create ApplicationRow component
    - Create `src/components/ApplicationRow.tsx`
    - Accept props: application (Application), onPress callback
    - Circular gradient avatar: 50×50 with music note icon overlay
    - Venue name: 15pt, semibold, single line truncation
    - Date: 12pt, textSecondary, short date format
    - Trailing StatusBadge showing application status
    - Row background: backgroundElement, 12px rounded corners, 12px internal padding
    - 12px horizontal spacing between avatar and text
    - Pressable with onPress callback passing application ID
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 4.4 Create HeroStatsCard component
    - Create `src/components/HeroStatsCard.tsx`
    - Accept props: stats (array of {number, label, color})
    - Horizontal row with equal-width stat boxes
    - Number: title2 bold, colored per stat
    - Label: caption, secondary color, centered below number
    - Background: linear gradient (blue 0.1 → purple 0.1), 16px rounded corners
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 5. Screen integration — Home, Activity, Explore
  - [x] 5.1 Redesign Home screen with new layout
    - Update `src/app/(tabs)/index.tsx`
    - Add SectionTitle with "Home" text and profile avatar navigation
    - Add horizontal scrollable FilterChip row for all GigFilter values, 'all' selected by default
    - Add SectionHeader "Nearby Gigs" with "See All" action
    - Add horizontal GigCard carousel (up to 20 cards) for nearby gigs
    - Add SectionHeader "Recommended For You"
    - Add second horizontal GigCard carousel for recommended gigs
    - Wire filter selection to update both carousels via filterGigsByTimeRange
    - Display empty-state message when no gigs match filter
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 16.1_

  - [x] 5.2 Create Activity tab screen
    - Create `src/app/(tabs)/activity.tsx`
    - Add SectionTitle with "Activity" text and profile avatar
    - Add SectionHeader "Your Applications" with "View All" action
    - Render ApplicationRow for each application from mock data
    - Maintain input array order for rendered rows
    - Display empty-state message when no applications exist
    - Navigate to gig detail on row press
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 5.3 Update Explore screen with SectionTitle header
    - Update `src/app/(tabs)/explore.tsx`
    - Add SectionTitle with "Explore" text and profile avatar navigation
    - _Requirements: 2.3_

- [x] 6. Tab navigation restructuring
  - [x] 6.1 Update tab layout to replace Profile with Activity
    - Modify `src/app/(tabs)/_layout.tsx`
    - Change tabs to: Home (house icon), Explore (map icon), Activity (clock icon)
    - Remove Profile tab from tab navigator
    - Ensure Home is the default/initial tab
    - Keep profile.tsx accessible as a stack route (via avatar navigation) but not as a tab
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 6.2 Write unit tests for tab navigation and screen rendering
    - Test tab navigator renders exactly 3 tabs: Home, Explore, Activity
    - Test Home tab is initially selected
    - Test correct icons for each tab
    - Test no Profile tab exists
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The GigCard redesign changes its interface — existing usages in the Home screen are updated in task 5.1
- `expo-linear-gradient` is needed for GigCard and HeroStatsCard — verify it's installed before starting task 4.1
- `@expo/vector-icons` (Ionicons) is used for icon elements — already available in Expo projects

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.5"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["1.4", "2.2", "4.3", "4.4"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "5.2", "5.3"] },
    { "id": 5, "tasks": ["5.1"] },
    { "id": 6, "tasks": ["6.1"] },
    { "id": 7, "tasks": ["6.2"] }
  ]
}
```
