# Requirements Document

## Introduction

This document captures the requirements for aligning the existing React Native/Expo Transient app with the SwiftUI reference implementation. The alignment introduces a redesigned tab structure, richer visual components (GigCard, FilterChip, SectionTitle, SectionHeader, ApplicationRow, StatusBadge, HeroStatsCard), a new Activity tab with application tracking, and profile access via a header avatar instead of a dedicated tab. These requirements are derived from the approved design document.

## Glossary

- **Tab_Navigator**: The bottom tab bar component that provides primary navigation between the app's main screens
- **Home_Screen**: The first tab screen displaying filter chips, gig carousels, and section headers
- **Explore_Screen**: The second tab screen displaying the map-based gig discovery view
- **Activity_Screen**: The third tab screen displaying the user's gig applications and their statuses
- **SectionTitle_Component**: A shared component rendering a large bold heading with a profile avatar button
- **SectionHeader_Component**: A shared component rendering a section heading with an optional trailing action button
- **FilterChip_Component**: A capsule-shaped button used for time-based gig filtering
- **GigCard_Component**: A visual card displaying gig details including image area, venue, date, payment, and genre chips
- **ApplicationRow_Component**: A list row displaying a gig application with avatar, venue info, and status badge
- **StatusBadge_Component**: A capsule-shaped colored badge displaying application status text
- **HeroStatsCard_Component**: A gradient summary card displaying key musician statistics
- **Filter_Service**: The utility module providing gig filtering by time range
- **Application**: A data object representing a user's application to a gig, containing venue, date, and status
- **ApplicationStatus**: An enum type with values 'pending', 'accepted', or 'declined'
- **GigFilter**: An enum type with values 'all', 'today', 'thisWeek', or 'nextWeek'
- **SemanticColors**: A set of named color tokens for status indicators, gradients, and action elements

## Requirements

### Requirement 1: Tab Navigation Structure

**User Story:** As a musician, I want to navigate between Home, Explore, and Activity tabs, so that I can discover gigs, explore a map, and track my applications from a single interface.

#### Acceptance Criteria

1. THE Tab_Navigator SHALL render exactly three tabs in left-to-right order: "Home", "Explore", and "Activity"
2. WHEN the app loads, THE Tab_Navigator SHALL display the Home tab as the initially selected tab with the active tab visually distinguished from inactive tabs by a distinct icon and label color
3. THE Tab_Navigator SHALL display a house icon for the Home tab, a map icon for the Explore tab, and a clock icon for the Activity tab
4. THE Tab_Navigator SHALL NOT include a Profile tab
5. WHEN a user taps a tab, THE Tab_Navigator SHALL navigate to the corresponding screen and update the visual indicator to reflect the newly active tab

---

### Requirement 2: Profile Access via Avatar

**User Story:** As a musician, I want to access my profile by tapping an avatar in the screen header, so that I can view and edit my profile without a dedicated tab.

#### Acceptance Criteria

1. WHEN a tab screen renders, THE SectionTitle_Component SHALL display a circular profile avatar (40×40 pixels) on the trailing edge of the component, with a minimum pressable touch target of 44×44 pixels
2. WHEN a user presses the profile avatar, THE SectionTitle_Component SHALL navigate to the Profile screen within 300ms
3. THE SectionTitle_Component SHALL render the avatar with a pressable interaction on every tab screen (Home, Explore, Activity)
4. IF no profile image is available for the current user, THEN THE SectionTitle_Component SHALL display a placeholder icon within the 40×40 circular avatar area

---

### Requirement 3: SectionTitle Component

**User Story:** As a musician, I want to see a clear, bold title at the top of each screen with quick profile access, so that I always know which section I am in.

#### Acceptance Criteria

1. THE SectionTitle_Component SHALL render the section name in bold text at 34-point equivalent size with font weight 700 using the theme `text` color token for the current color scheme
2. THE SectionTitle_Component SHALL accept a `sectionName` string prop (maximum 30 characters) and an `onProfilePress` callback prop
3. THE SectionTitle_Component SHALL apply horizontal padding of 20 pixels, top padding of 8 pixels, and bottom padding of 4 pixels
4. THE SectionTitle_Component SHALL lay out the title text and the 40×40 pixel circular profile avatar in a horizontal row with center vertical alignment, the title on the leading edge and the avatar on the trailing edge
5. IF the section name text exceeds the available horizontal space after accounting for the avatar and padding, THEN THE SectionTitle_Component SHALL truncate the title with an ellipsis rather than overlapping the avatar or wrapping to a second line
6. THE SectionTitle_Component SHALL render the profile avatar as a pressable element with an accessibility label of "Profile"

---

### Requirement 4: SectionHeader Component

**User Story:** As a musician, I want to see labelled sections with optional action links, so that I can understand content grouping and navigate to full lists.

#### Acceptance Criteria

1. THE SectionHeader_Component SHALL render the title using the system sans font at 20 pixels with font weight 600 (semibold), colored with the theme text token
2. WHERE an actionTitle prop is provided, THE SectionHeader_Component SHALL render a trailing action button displaying the provided text at 15 pixels with a minimum tap target of 44×44 points, colored blue, and positioned at the trailing end of the header row
3. WHEN the action button is pressed and an onAction callback is provided, THE SectionHeader_Component SHALL invoke the onAction callback exactly once per press
4. WHERE no actionTitle prop is provided, THE SectionHeader_Component SHALL render only the title without a trailing button
5. THE SectionHeader_Component SHALL arrange its content in a horizontal row with the title aligned to the leading edge and the action button (if present) aligned to the trailing edge, with horizontal padding equal to the Spacing.three token (16 points)

---

### Requirement 5: FilterChip Component

**User Story:** As a musician, I want to filter gigs by time period using visual chip buttons, so that I can quickly narrow down relevant gigs.

#### Acceptance Criteria

1. THE FilterChip_Component SHALL render its title text at a font size of 15 pixels within a capsule-shaped container using a border radius equal to half the component height
2. WHILE the FilterChip is in selected state, THE FilterChip_Component SHALL display white (#FFFFFF) text with semibold font weight on a blue accent background (the system tint color)
3. WHILE the FilterChip is in unselected state, THE FilterChip_Component SHALL display text using the theme text color on a backgroundElement token color background with regular font weight
4. WHEN the FilterChip is pressed, THE FilterChip_Component SHALL invoke its onPress callback with no delay
5. THE FilterChip_Component SHALL apply horizontal padding of 16 pixels and vertical padding of 8 pixels, resulting in a minimum touch target height of 44 pixels
6. THE FilterChip_Component SHALL set accessibilityRole to "button" and include the title text as the accessibility label

---

### Requirement 6: Home Screen Layout

**User Story:** As a musician, I want the Home screen to display filter chips and gig carousels organized by section, so that I can browse and filter gigs efficiently.

#### Acceptance Criteria

1. WHEN the Home screen renders, THE Home_Screen SHALL display a SectionTitle with the text "Home" and a profile avatar
2. WHEN the Home screen renders, THE Home_Screen SHALL display a horizontal scrollable row of FilterChip components for all GigFilter values ('all', 'today', 'thisWeek', 'nextWeek') with the 'all' filter selected by default
3. WHEN the Home screen renders, THE Home_Screen SHALL display a SectionHeader with title "Nearby Gigs" and a "See All" action button
4. WHEN the Home screen renders, THE Home_Screen SHALL display a horizontal scrollable carousel of up to 20 GigCard components below the "Nearby Gigs" header
5. WHEN the Home screen renders, THE Home_Screen SHALL display a SectionHeader with title "Recommended For You" below the first carousel
6. WHEN the Home screen renders, THE Home_Screen SHALL display a second horizontal scrollable carousel of up to 20 GigCard components below the "Recommended For You" header
7. WHEN a user selects a FilterChip, THE Home_Screen SHALL update both the "Nearby Gigs" and "Recommended For You" carousels to display only gigs whose dates fall within the selected time range
8. IF the active filter results in no gigs for a carousel section, THEN THE Home_Screen SHALL display an empty-state message within that section indicating no gigs match the selected filter

---

### Requirement 7: GigCard Redesign

**User Story:** As a musician, I want gig cards that display an image area, venue details, date, payment, and genre tags, so that I can quickly assess gig suitability at a glance.

#### Acceptance Criteria

1. THE GigCard_Component SHALL render at a fixed width of 280 pixels
2. THE GigCard_Component SHALL render an image area of 280×140 pixels filled with a blue-to-purple linear gradient at 0.3 opacity as a placeholder when no gig image is available
3. THE GigCard_Component SHALL render a heart/favorite icon button positioned at the top-right of the image area with a minimum tap target of 44×44 pixels and a circular background at 0.5 opacity
4. WHEN the favorite icon is pressed, THE GigCard_Component SHALL invoke the onFavorite callback with the gig ID
5. THE GigCard_Component SHALL display the venue name in bold text at 16px font size, limited to 1 line with trailing ellipsis when text overflows
6. THE GigCard_Component SHALL display the gig date with a calendar icon prefix in 12px font using the textSecondary color token from the theme
7. THE GigCard_Component SHALL display the payment amount formatted as currency with symbol and two decimal places, with a banknote icon prefix in 12px font using a distinct color differentiable from textSecondary
8. THE GigCard_Component SHALL display at most 2 genre chips in capsule-shaped badges using the backgroundElement color token from the theme as background; IF the gig has fewer than 2 genres, THEN THE GigCard_Component SHALL display only the available genre chips
9. THE GigCard_Component SHALL apply rounded corners of 12 pixels and platform-appropriate elevation (elevation 2 on Android, shadow with 0.1 opacity, 8px radius, and 4px y-offset on iOS/web)
10. WHEN the GigCard is pressed, THE GigCard_Component SHALL invoke the onPress callback with the gig ID
11. THE GigCard_Component SHALL provide an accessibilityLabel that includes the venue name, date, and pay amount so that screen readers convey the gig summary

---

### Requirement 8: Gig Filtering Logic

**User Story:** As a musician, I want gigs filtered accurately by time period, so that I only see gigs relevant to my availability.

#### Acceptance Criteria

1. WHEN the filter is set to 'all', THE Filter_Service SHALL return all gigs from the input array unchanged
2. WHEN the filter is set to 'today', THE Filter_Service SHALL return only gigs whose date field (YYYY-MM-DD) matches the device's current local date at the time of invocation
3. WHEN the filter is set to 'thisWeek', THE Filter_Service SHALL return only gigs whose date falls within the current week, where the week starts on Monday 00:00 and ends on Sunday 23:59 based on the device's local date
4. WHEN the filter is set to 'nextWeek', THE Filter_Service SHALL return only gigs whose date falls within the next week (the Monday-through-Sunday period immediately following the current week) based on the device's local date
5. THE Filter_Service SHALL return a subset of the input array for any valid filter value — no new gigs shall be created or duplicated
6. THE Filter_Service SHALL preserve the original order of gigs in the filtered result
7. IF the filter value is not one of 'all', 'today', 'thisWeek', or 'nextWeek', THEN THE Filter_Service SHALL return an empty array

---

### Requirement 9: Activity Screen

**User Story:** As a musician, I want to see a list of my gig applications with their current status, so that I can track which gigs I have applied to and their outcomes.

#### Acceptance Criteria

1. WHEN the Activity screen renders, THE Activity_Screen SHALL display a SectionTitle with the text "Activity" and a profile avatar
2. WHEN the Activity screen renders, THE Activity_Screen SHALL display a SectionHeader with title "Your Applications" and a "View All" action button that navigates to a full list of all applications
3. WHEN the Activity screen renders, THE Activity_Screen SHALL display an ApplicationRow for each application belonging to the current musician, where each ApplicationRow displays the venue name, date, and a status indicator showing one of: "Pending", "Accepted", or "Declined"
4. THE Activity_Screen SHALL render ApplicationRow components in the same order as the input application array
5. IF the current musician has no applications, THEN THE Activity_Screen SHALL display an empty-state message indicating that no applications have been submitted yet
6. WHEN a user taps an ApplicationRow, THE Activity_Screen SHALL navigate to the gig detail screen for the associated gig

---

### Requirement 10: ApplicationRow Component

**User Story:** As a musician, I want each application entry to show the venue, date, and current status clearly, so that I can understand my application state at a glance.

#### Acceptance Criteria

1. THE ApplicationRow_Component SHALL render a circular gradient avatar of 50×50 pixels with a centered music note icon overlay, where the gradient transitions from top-left to bottom-right
2. THE ApplicationRow_Component SHALL display the venue name in subheadline font (15pt) with semibold weight, truncated to a single line with an ellipsis if the text exceeds the available width
3. THE ApplicationRow_Component SHALL display the application date in caption font (12pt) using the textSecondary color token, formatted as short date (e.g., "Mon, Jan 15")
4. THE ApplicationRow_Component SHALL render a StatusBadge_Component on the trailing edge showing the application status
5. THE ApplicationRow_Component SHALL apply a backgroundElement token color as the row background with 12-pixel rounded corners and 12 pixels of internal padding on all sides
6. THE ApplicationRow_Component SHALL use 12-pixel horizontal spacing between the avatar and the text content
7. WHEN a user taps an ApplicationRow_Component, THE ApplicationRow_Component SHALL invoke its onPress callback with the application ID

---

### Requirement 11: StatusBadge Component

**User Story:** As a musician, I want application statuses displayed as colored badges, so that I can instantly recognize whether an application is pending, accepted, or declined.

#### Acceptance Criteria

1. THE StatusBadge_Component SHALL render the status text in a font size of 11 points with semibold weight and white foreground color, with the status value displayed in capitalized form (first letter uppercase, remaining lowercase)
2. WHILE the status is 'pending', THE StatusBadge_Component SHALL display an orange background (#FF9500)
3. WHILE the status is 'accepted', THE StatusBadge_Component SHALL display a green background (#34C759)
4. WHILE the status is 'declined', THE StatusBadge_Component SHALL display a red background (#FF3B30)
5. THE StatusBadge_Component SHALL render with a capsule shape, horizontal padding of 10 pixels, and vertical padding of 5 pixels
6. THE StatusBadge_Component SHALL return the corresponding hex color string for every ApplicationStatus value ('pending' → #FF9500, 'accepted' → #34C759, 'declined' → #FF3B30) without fallback to undefined
7. THE StatusBadge_Component SHALL accept a single required prop of type ApplicationStatus and render no content if the prop is not provided

---

### Requirement 12: HeroStatsCard Component

**User Story:** As a musician, I want a summary card showing key stats like active gigs and applications, so that I have a quick dashboard overview of my activity.

#### Acceptance Criteria

1. THE HeroStatsCard_Component SHALL render stat items in a horizontal row with equal-width boxes
2. THE HeroStatsCard_Component SHALL display each stat's number in title2 bold font with the specified color
3. THE HeroStatsCard_Component SHALL display each stat's label in caption font with secondary color, centered below the number
4. THE HeroStatsCard_Component SHALL apply a linear gradient background (blue 0.1 to purple 0.1) with 16-pixel rounded corners

---

### Requirement 13: Data Types

**User Story:** As a developer, I want well-defined TypeScript types for Application, ApplicationStatus, and GigFilter, so that the data layer is type-safe and consistent.

#### Acceptance Criteria

1. THE Application type SHALL include fields: id (string), venue (string), date (string in ISO 8601 format YYYY-MM-DD), status (ApplicationStatus), and optional gigId (string referencing a Gig id)
2. THE ApplicationStatus type SHALL be a union of exactly three string literals: 'pending', 'accepted', 'declined'
3. THE GigFilter type SHALL be a union of exactly four string literals: 'all', 'today', 'thisWeek', 'nextWeek'
4. THE Application type SHALL require id, venue, date, and status as non-optional fields, with gigId as the only optional field
5. THE types module SHALL export Application, ApplicationStatus, and GigFilter so they are importable by any module in the application via the @/ path alias

---

### Requirement 14: Theme and Semantic Color Tokens

**User Story:** As a developer, I want named semantic color tokens for statuses, gradients, and actions, so that the UI is consistent and maintainable.

#### Acceptance Criteria

1. THE SemanticColors object SHALL include color tokens organized by light and dark theme variants (matching the existing Colors object structure) for: favorite, statusPending, statusAccepted, statusDeclined, paymentGreen, actionBlue, where each token value is a hex color string
2. THE SemanticColors object SHALL include gradient and material tokens organized by light and dark theme variants for: gradientStart, gradientEnd, cardImageGradientStart, cardImageGradientEnd, and ultraThinMaterial, where each token value is a color string supporting alpha transparency (RGBA hex or rgba format)
3. THE SemanticColors object SHALL be exported as a named export from the theme constants module alongside existing Colors, Fonts, and Spacing exports
4. WHEN a component references a semantic color token, THE SemanticColors object SHALL provide distinct values for light and dark theme variants for every defined token, ensuring no token key is missing from either variant

---

### Requirement 15: Genre Truncation

**User Story:** As a musician, I want genre chips on gig cards limited to a reasonable count, so that the card layout remains clean and uncluttered.

#### Acceptance Criteria

1. WHEN a gig has more than 2 genres, THE GigCard_Component SHALL display only the first 2 genres in the order they appear in the gig data, followed by a label indicating the number of remaining genres (e.g., "+3")
2. IF a gig has 2 or fewer genres, THEN THE GigCard_Component SHALL display all genres in the order they appear in the gig data
3. THE GigCard_Component SHALL render each displayed genre as an individual chip element preserving the sequence order from the gig data source

---

### Requirement 16: Error Handling

**User Story:** As a musician, I want the app to handle missing or invalid data gracefully, so that the experience remains stable even with incomplete information.

#### Acceptance Criteria

1. WHEN no gigs match the selected filter, THE Home_Screen SHALL display an empty state message rather than a blank area
2. IF an application has an unexpected status value, THEN THE StatusBadge_Component SHALL fall back to a neutral gray color and display the raw status text
3. WHEN a gig has an empty or undefined genres array, THE GigCard_Component SHALL render without genre chips and without crashing
4. IF the profile navigation route is unavailable, THEN THE SectionTitle_Component SHALL handle the press as a no-op without crashing
