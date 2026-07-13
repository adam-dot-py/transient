# Implementation Plan

## Overview

Fix three UI/navigation regressions from the SwiftUI alignment redesign: (1) add back navigation to gig detail screen, (2) wrap Explore tab in SafeAreaView for consistent title alignment, (3) add SectionTitle to HosterDashboard for consistent header layout. Uses bug condition methodology — write exploration and preservation tests first, then implement fixes.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Missing Navigation Affordances and Layout Elements
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate all three bugs exist in the current code
  - **Scoped PBT Approach**: Scope the property to the three concrete failing cases identified in the bug condition
  - Test 1a: Render `GigDetailScreen` with a valid gig ID and assert a back button/pressable with accessible navigation affordance exists in the normal (gig found) view — expected to FAIL (no back button exists in the happy-path render)
  - Test 1b: Render `ExploreScreen` and assert the root container is `SafeAreaView` from `react-native-safe-area-context` for all three return paths (mapError, empty gigs, normal) — expected to FAIL (currently uses plain `View`)
  - Test 1c: Render `HomeScreen` with role set to `'hoster'` and assert `SectionTitle` component is rendered with "Home" text — expected to FAIL (HosterDashboard omits SectionTitle)
  - Bug Condition: `isBugCondition(input)` returns true when `(screen === '/gig/[id]' AND action === 'navigateBack') OR (screen === '/(tabs)/explore' AND action === 'renderTitle') OR (screen === '/(tabs)/index' AND role === 'hoster' AND action === 'renderHeader')`
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: All three tests FAIL (this is correct - it proves the bugs exist)
  - Document counterexamples: GigDetailScreen render tree has no back button element; ExploreScreen root is `View` not `SafeAreaView`; HosterDashboard does not contain `SectionTitle`
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Functionality Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: GigDetailScreen renders all gig fields (title, venue, address, date, time, genre, pay, description) correctly on unfixed code
  - Observe: GigDetailScreen "Accept Gig" button triggers acceptance and shows confirmation banner on unfixed code
  - Observe: MusicianDashboard renders SectionTitle, filter chips, and gig carousels correctly on unfixed code
  - Observe: ExploreScreen map container and marker popup render correctly on unfixed code (separate from SafeAreaView wrapper)
  - Observe: HosterDashboard "Create Gig" button renders and navigates to `/gig/create` on unfixed code
  - Write property-based tests: for all valid gig data, GigDetailScreen renders title, venue, date, time, genre, and pay fields correctly
  - Write property-based tests: for all non-bug-condition inputs (musician role Home, Activity tab, gig acceptance flow), the output matches observed behavior
  - Write preservation test: HosterDashboard continues to render "Create Gig" button after any header changes
  - Verify all preservation tests PASS on UNFIXED code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for UI navigation and layout consistency bugs

  - [x] 3.1 Add back navigation header to gig detail screen
    - In `src/app/gig/[id].tsx`, add a header row above the ScrollView (inside the main SafeAreaView) containing a back button with a chevron icon and "Back" label
    - Use `router.back()` as the onPress handler (router already imported)
    - Style with theme colors (`colors.text` for the icon/text, proper Spacing tokens)
    - Add `accessibilityLabel="Go back"` and `accessibilityRole="button"` for accessibility
    - Import `Ionicons` from `@expo/vector-icons` for the chevron-back icon
    - Only add to the normal (gig found) return path — the not-found path already has a back button
    - _Bug_Condition: isBugCondition(input) where input.screen === '/gig/[id]' AND input.action === 'navigateBack'_
    - _Expected_Behavior: A visible, pressable back button that calls router.back()_
    - _Preservation: Gig detail content display, acceptance flow, and confirmation banner unchanged_
    - _Requirements: 2.1, 3.3_

  - [x] 3.2 Wrap Explore screen in SafeAreaView (all return paths)
    - In `src/app/(tabs)/explore.tsx`, replace `import { StyleSheet, Text, View } from 'react-native'` to also keep View for inner containers
    - Add `import { SafeAreaView } from 'react-native-safe-area-context'`
    - Replace the root `<View style={[styles.screenContainer, ...]}>` with `<SafeAreaView style={[styles.screenContainer, ...]}>` in ALL THREE return paths (mapError, empty gigs, normal)
    - Keep inner containers as `View` — only the outermost wrapper changes to `SafeAreaView`
    - This ensures SectionTitle renders at the same vertical offset as Home and Activity tabs
    - _Bug_Condition: isBugCondition(input) where input.screen === '/(tabs)/explore' AND input.action === 'renderTitle'_
    - _Expected_Behavior: Explore title renders at same vertical position as Home and Activity titles_
    - _Preservation: Map rendering, marker popups, and gig navigation from Explore unchanged_
    - _Requirements: 2.2, 3.1, 3.2_

  - [x] 3.3 Add SectionTitle to HosterDashboard
    - In `src/app/(tabs)/index.tsx`, inside the `HosterDashboard` function, add `<SectionTitle sectionName="Home" onProfilePress={() => router.push('/profile')} />` at the top of the ScrollView content (before the "Create Gig" Pressable)
    - SectionTitle is already imported in this file (used by MusicianDashboard)
    - This provides hosters with the profile avatar access and consistent header layout matching other tabs
    - _Bug_Condition: isBugCondition(input) where input.screen === '/(tabs)/index' AND input.role === 'hoster' AND input.action === 'renderHeader'_
    - _Expected_Behavior: HosterDashboard renders SectionTitle with "Home" text and profile avatar button_
    - _Preservation: Create Gig button, Active Gigs list, Past Gigs list remain unchanged_
    - _Requirements: 2.3, 3.1_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Navigation and Layout Elements Present
    - **IMPORTANT**: Re-run the SAME tests from task 1 - do NOT write new tests
    - The tests from task 1 encode the expected behavior for all three bugs
    - When these tests pass, it confirms: back button exists on gig detail, SafeAreaView wraps Explore, SectionTitle exists in HosterDashboard
    - Run bug condition exploration tests from step 1
    - **EXPECTED OUTCOME**: All three tests PASS (confirms bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Functionality Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm: gig detail content renders correctly, accept flow works, musician dashboard unchanged, explore map works, create gig button still accessible
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite (`npx jest --run`) to confirm no regressions
  - Verify bug condition tests (task 1) all pass after fix
  - Verify preservation tests (task 2) all pass after fix
  - Verify existing tests in `src/__tests__/` still pass
  - Ensure all tests pass, ask the user if questions arise.


## Task Dependency Graph

```json
{
  "waves": [
    { "tasks": ["1", "2"] },
    { "tasks": ["3"] },
    { "tasks": ["4"] }
  ]
}
```

Tasks 1 and 2 are independent and can be done in parallel. Task 3 depends on both 1 and 2 being complete. Task 4 depends on task 3.

## Notes

- The project uses `@testing-library/react-native` for component tests (see existing tests in `src/__tests__/`)
- Mock expo-linear-gradient and other native modules as needed (pattern established in `GigCard.test.tsx`)
- The `SectionTitle` component accepts `sectionName: string` and `onProfilePress: () => void`
- `SafeAreaView` should be imported from `react-native-safe-area-context` (not from `react-native`)
- The gig detail "not found" state already has a back button — only the happy-path view needs the fix
- HosterDashboard already uses `SafeAreaView` as its root — only the `SectionTitle` is missing
