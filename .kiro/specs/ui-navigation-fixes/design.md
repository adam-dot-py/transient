# UI Navigation Fixes Bugfix Design

## Overview

Three UI/navigation regressions introduced during the SwiftUI alignment redesign need to be fixed: (1) missing back navigation from the gig detail screen, (2) misaligned Explore tab title due to inconsistent safe area handling, and (3) hoster role's Create Gig access lacking the standard header layout. The fix strategy is minimal and targeted — add a back button to the gig detail stack screen, wrap Explore in SafeAreaView for consistent insets, and add the SectionTitle header to the HosterDashboard.

## Glossary

- **Bug_Condition (C)**: The set of navigation/layout states where the UI deviates from the consistent pattern established by other screens
- **Property (P)**: Correct navigation affordances and consistent layout alignment across all tab screens and detail routes
- **Preservation**: Existing gig acceptance flow, Create Gig form validation, role switching, and musician dashboard layout that must remain unchanged
- **SectionTitle**: The shared component (`src/components/SectionTitle.tsx`) rendering a large bold heading with a profile avatar button at the top of each tab screen
- **SafeAreaView**: The `react-native-safe-area-context` wrapper that applies device safe area insets (notch, status bar) to content
- **Stack**: The Expo Router root navigator (`src/app/_layout.tsx`) that manages screen-to-screen transitions
- **HosterDashboard**: The conditional view in `src/app/(tabs)/index.tsx` shown when `role === 'hoster'`

## Bug Details

### Bug Condition

The bugs manifest across three distinct UI states after the SwiftUI alignment redesign removed or failed to add key navigation elements. The root layout hides all headers globally (`headerShown: false`), and individual screens were expected to provide their own navigation affordances — but this was done inconsistently.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { screen: ScreenRoute, role: UserRole, action: UserAction }
  OUTPUT: boolean
  
  RETURN (input.screen === '/gig/[id]' AND input.action === 'navigateBack')
         OR (input.screen === '/(tabs)/explore' AND input.action === 'renderTitle')
         OR (input.screen === '/(tabs)/index' AND input.role === 'hoster' AND input.action === 'renderHeader')
END FUNCTION
```

### Examples

- **Bug 1**: User taps a gig card from Home → navigates to `/gig/abc123` → no back button visible → user is stuck (must use system gesture only, which is not discoverable)
- **Bug 2**: User switches to Explore tab → "Explore" title renders higher/lower than "Home" or "Activity" titles because safe area insets are not applied
- **Bug 3**: User switches to hoster role → Home tab shows "Create Gig" button and gig lists but lacks the SectionTitle header, making the layout inconsistent and the profile avatar inaccessible
- **Edge case**: Gig detail "not found" state already has a "Go Back" button — only the happy-path detail view is affected

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Mouse/tap on gig cards from Home navigates to gig detail and displays all gig information correctly
- "Accept Gig" button on gig detail triggers acceptance and shows the confirmation banner
- Create Gig form validates input, creates gig, and navigates back on success
- Role switching via the profile screen toggles between musician and hoster views
- Musician dashboard SectionTitle, filter chips, and gig carousels render correctly
- Activity tab SectionTitle and application list render correctly
- Tab bar icons, labels, and active state highlighting remain unchanged

**Scope:**
All inputs that do NOT involve (a) back navigation from `/gig/[id]`, (b) the Explore tab's title layout, or (c) the hoster Home tab header should be completely unaffected by these fixes. This includes:
- Gig detail content display and acceptance flow
- Create Gig form interaction
- Map rendering on Explore tab
- Activity tab application list
- Profile screen and role switching

## Hypothesized Root Cause

Based on code analysis, the root causes are:

1. **Missing back navigation (Bug 1)**: The root `_layout.tsx` sets `headerShown: false` on all Stack screens. The `gig/[id].tsx` screen renders its own layout but does not include any back button or navigation header in the normal (gig found) state. The "Go Back" button only exists in the error/not-found branch.

2. **Explore title misalignment (Bug 2)**: Home (`index.tsx`) and Activity (`activity.tsx`) wrap their content in `SafeAreaView` from `react-native-safe-area-context`, which pushes content below the status bar/notch. Explore (`explore.tsx`) uses a plain `View` as its root container — the `SectionTitle` renders without safe area inset padding, causing vertical misalignment.

3. **Hoster Create Gig access (Bug 3)**: The `HosterDashboard` function in `index.tsx` renders the "Create Gig" button and gig lists but omits the `SectionTitle` component that `MusicianDashboard` and all other tabs include. This means hosters lose the consistent header pattern (title + profile avatar) and the layout feels broken.

## Correctness Properties

Property 1: Bug Condition - Navigation and Layout Consistency

_For any_ screen state where the bug condition holds (isBugCondition returns true), the fixed UI SHALL provide the correct navigation affordance or layout element: a visible back button on the gig detail screen, proper safe area inset handling on the Explore title, and a SectionTitle header on the hoster Home tab.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Functionality Unchanged

_For any_ screen state where the bug condition does NOT hold (isBugCondition returns false), the fixed code SHALL produce the same visual output and behavior as the original code, preserving gig acceptance, form validation, role switching, musician dashboard layout, and Activity tab rendering.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/app/gig/[id].tsx`

**Change 1 — Add back navigation header**:
- Add a header row at the top of the ScrollView (or above it) containing a back button (chevron icon + "Back" text or just a chevron)
- Use `router.back()` as the onPress handler (already imported)
- Style consistently with the rest of the detail screen (use theme colors, proper spacing)
- Alternatively, configure the Stack screen options in `_layout.tsx` to show a header specifically for `gig/[id]` — but given the app's custom-header pattern, an inline back button is more consistent

---

**File**: `src/app/(tabs)/explore.tsx`

**Change 2 — Wrap in SafeAreaView**:
- Replace the root `<View style={[styles.screenContainer, ...]}>`  with `<SafeAreaView>` from `react-native-safe-area-context`
- Import `SafeAreaView` from `react-native-safe-area-context` (same source Home and Activity use)
- Apply the same `flex: 1` and background color styling
- This ensures `SectionTitle` renders at the same vertical offset as on Home and Activity

---

**File**: `src/app/(tabs)/index.tsx`

**Change 3 — Add SectionTitle to HosterDashboard**:
- Add `<SectionTitle sectionName="Home" onProfilePress={() => router.push('/profile')} />` at the top of the HosterDashboard's ScrollView content (before the "Create Gig" button)
- This mirrors what `MusicianDashboard` already does and provides hosters with the profile avatar access and consistent header

---

**File**: `src/app/(tabs)/explore.tsx` (all three error/empty/normal return paths)

**Change 2b — Ensure all branches use SafeAreaView**:
- The `mapError` and `availableGigs.length === 0` early-return branches also use plain `View` — update all three return paths to use `SafeAreaView`

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write component render tests that check for the presence/absence of navigation elements and verify layout structure. Run these on the UNFIXED code to observe failures.

**Test Cases**:
1. **Back Button Presence Test**: Render `GigDetailScreen` with a valid gig ID and assert a back button/pressable with "Back" label exists (will fail on unfixed code)
2. **Explore SafeAreaView Test**: Render `ExploreScreen` and assert the root element is `SafeAreaView` from `react-native-safe-area-context` (will fail on unfixed code — currently uses `View`)
3. **Hoster SectionTitle Test**: Render `HomeScreen` with role set to `'hoster'` and assert `SectionTitle` is rendered (will fail on unfixed code)
4. **Explore Title Vertical Position**: Snapshot or measure the title position relative to screen top and compare across tabs (will show misalignment on unfixed code)

**Expected Counterexamples**:
- GigDetailScreen render tree has no accessible back button element
- ExploreScreen root is a `View` not `SafeAreaView`
- HosterDashboard render tree does not contain `SectionTitle`
- Possible causes confirmed: missing component inclusion, wrong container type

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed UI produces the expected navigation affordance or layout.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderScreen_fixed(input)
  ASSERT expectedLayoutElement(result)
END FOR
```

Specifically:
- For `/gig/[id]`: assert back button exists and triggers `router.back()` on press
- For `/(tabs)/explore`: assert root is `SafeAreaView` and title vertical offset matches Home/Activity
- For `/(tabs)/index` with `role === 'hoster'`: assert `SectionTitle` is rendered with "Home" text

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderScreen_original(input) = renderScreen_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (random gig data, different roles, different screen states)
- It catches edge cases that manual unit tests might miss (e.g., empty gig lists, boundary dates)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for all non-bug-condition interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Gig Detail Content Preservation**: Verify all gig detail fields render correctly for any valid gig data after adding the back button
2. **Accept Gig Preservation**: Verify the accept flow (button press → state change → banner) still works identically
3. **Musician Dashboard Preservation**: Verify musician role Home tab renders identically (SectionTitle already present, filters, carousels)
4. **Create Gig Form Preservation**: Verify the form validation and submission flow is unchanged
5. **Explore Map Preservation**: Verify the map and marker popup behavior is unchanged after SafeAreaView swap

### Unit Tests

- Test that GigDetailScreen renders a back button with correct accessibility label
- Test that pressing the back button calls `router.back()`
- Test that ExploreScreen uses SafeAreaView as root container
- Test that HosterDashboard renders SectionTitle with "Home" text
- Test that HosterDashboard still renders "Create Gig" button after adding SectionTitle

### Property-Based Tests

- Generate random valid Gig objects and verify GigDetailScreen always renders both the back button AND all gig fields correctly
- Generate random role/gig-list combinations and verify the Home tab always renders SectionTitle regardless of role
- Generate random available gig lists and verify Explore renders correctly with SafeAreaView wrapper

### Integration Tests

- Test full navigation flow: Home → tap gig card → gig detail → tap back → returns to Home
- Test Explore → tap marker → popup → tap gig → detail → back → returns to Explore
- Test role switch to hoster → verify SectionTitle + Create Gig button → tap Create Gig → form loads → submit → returns to hoster Home
