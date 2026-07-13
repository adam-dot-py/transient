# Requirements Document

## Introduction

Transient is a cross-platform mobile application (iOS, Android, Web) that connects musicians with gig opportunities and enables hosters (venues, event organizers) to find and book local talent. The app operates on a gig-economy model similar to Uber/Lyft — hosters post gigs that get pushed to nearby musicians, who can browse, evaluate, and accept them. This initial build establishes the core navigation, dashboard, map, role-based views, and local mock data layer needed to demonstrate the end-to-end musician/hoster flow.

## Glossary

- **App**: The Transient cross-platform mobile application built with Expo and React Native
- **Musician**: A registered user who browses and accepts gig opportunities
- **Hoster**: A registered user (venue, event organizer, or individual) who creates and publishes gig listings
- **Gig**: A single performance opportunity with a defined venue, date, time, genre, and pay
- **Dashboard**: The primary home screen displaying horizontally-scrollable gig carousels
- **Carousel**: A horizontal scrolling list component displaying gig cards within a labeled section
- **Gig_Card**: A compact visual element representing a single gig in a carousel or list
- **Map_View**: A screen displaying gig locations as markers on an interactive map
- **Mock_Data_Layer**: A local JSON-based data source used during development in place of live API calls
- **Tab_Navigator**: The bottom tab navigation bar providing access to primary app sections
- **Role_Switcher**: A mechanism allowing the user to toggle between Musician and Hoster perspectives

## Requirements

### Requirement 1: Tab-Based Navigation Structure

**User Story:** AS a user, I WANT a tab-based navigation structure, SO THAT I can quickly move between the main sections of the app.

#### Acceptance Criteria

1. THE App SHALL display a bottom Tab_Navigator with tabs for Home, Explore (Map), and Profile, with Home as the default active tab on app launch
2. WHEN a user taps a tab, THE Tab_Navigator SHALL navigate to the corresponding screen within 300ms
3. THE Tab_Navigator SHALL differentiate the active tab from inactive tabs by applying a distinct color to the active tab icon and label that differs from the inactive tab icon and label color
4. THE App SHALL use Expo Router file-based routing for all screen definitions
5. WHILE the user is on any top-level tab screen, THE Tab_Navigator SHALL remain visible at the bottom of the viewport

### Requirement 2: Musician Dashboard with Gig Carousels

**User Story:** As a musician, I want a dashboard with scrollable gig sections, so that I can quickly discover new gigs, revisit ones I viewed, and track upcoming commitments.

#### Acceptance Criteria

1. WHEN a Musician navigates to the Home tab, THE Dashboard SHALL display three distinct Carousel sections in this order: "Latest Gigs Near You", "Recently Viewed", and "Accepted / Upcoming"
2. THE Dashboard SHALL render each Carousel as a horizontally-scrollable list of Gig_Card components showing a maximum of 20 items per Carousel
3. WHEN a Carousel contains more items than fit on screen, THE Dashboard SHALL allow the user to scroll horizontally to reveal additional Gig_Card items
4. THE Gig_Card SHALL display the gig title (truncated to 40 characters with ellipsis if longer), venue name, date in short format (e.g., "Mon, Jan 15"), and offered pay formatted as currency
5. WHEN a user taps a Gig_Card, THE App SHALL navigate to the gig detail screen for that gig
6. IF a Carousel section has no items to display, THEN THE Dashboard SHALL show an empty-state message indicating why the section is empty (e.g., no gigs nearby, no recently viewed gigs, no accepted gigs)

### Requirement 3: Gig Detail Screen

**User Story:** As a musician, I want to see full details about a gig, so that I can make an informed decision about accepting it.

#### Acceptance Criteria

1. WHEN a Musician navigates to a gig detail screen, THE App SHALL display the gig title, venue name, full address, date, start time, end time, genre, pay amount (formatted with currency symbol and two decimal places), and description (up to 2000 characters)
2. WHEN a Musician navigates to a gig detail screen, THE App SHALL immediately add that gig to the "Recently Viewed" list, storing a maximum of 20 gigs and removing the oldest entry when the limit is exceeded
3. IF the gig has not been accepted, THEN THE gig detail screen SHALL display an enabled "Accept Gig" button
4. WHEN a Musician taps the "Accept Gig" button, THE App SHALL move the gig to the "Accepted / Upcoming" carousel, replace the "Accept Gig" button with a disabled "Accepted" indicator, and display a confirmation banner for 3 seconds
5. IF the gig has already been accepted, THEN THE gig detail screen SHALL display a disabled "Accepted" indicator in place of the "Accept Gig" button

### Requirement 4: Map View for Available Gigs

**User Story:** As a musician, I want to see available gigs on a map, so that I can find opportunities near my location.

#### Acceptance Criteria

1. WHEN a Musician navigates to the Explore tab, THE Map_View SHALL display a map centered on the user's mocked location that supports pan and pinch-to-zoom gestures
2. THE Map_View SHALL render a marker visually distinct from the base map for each gig with status "available" at its geographic coordinates
3. WHEN a user taps a gig marker on the map, THE Map_View SHALL display a summary popup with the gig title, venue, date, and pay, and SHALL dismiss any previously open popup
4. WHEN a user taps the summary popup, THE App SHALL navigate to the gig detail screen for that gig
5. IF the map fails to load, THEN THE Map_View SHALL display an error message indicating that the map is unavailable
6. IF no available gigs exist in the Mock_Data_Layer, THEN THE Map_View SHALL display a message indicating that no gigs are currently available

### Requirement 5: Hoster View — Create Gig

**User Story:** As a hoster, I want to create a new gig listing, so that I can find musicians for my event.

#### Acceptance Criteria

1. WHILE the user is in Hoster mode, THE App SHALL display a "Create Gig" action on the Home tab
2. WHEN a Hoster taps "Create Gig", THE App SHALL present a form with the following required fields: title (max 100 characters), venue name (max 100 characters), address (max 200 characters), date, start time, end time, genre (selected from a predefined list), and pay amount (numeric, between 1 and 99999); and one optional field: description (max 500 characters)
3. WHEN a Hoster submits a valid gig form, THE App SHALL save the gig to the Mock_Data_Layer, display a success confirmation message for at least 3 seconds, and navigate the user back to the Hoster Dashboard
4. IF a Hoster submits a gig form with missing required fields, THEN THE App SHALL display inline validation errors below each incomplete field identifying what is required
5. IF a Hoster submits a gig form where the end time is earlier than or equal to the start time, THEN THE App SHALL display a validation error indicating that the end time must be after the start time
6. IF a Hoster submits a gig form where the date is in the past, THEN THE App SHALL display a validation error indicating that the gig date must be today or a future date

### Requirement 6: Hoster Dashboard

**User Story:** As a hoster, I want a dashboard showing my posted gigs, so that I can track their status.

#### Acceptance Criteria

1. WHILE the user is in Hoster mode, THE Dashboard SHALL display two Carousel sections: "Active Gigs" (gigs with a date in the future) and "Past Gigs" (gigs with a date that has elapsed)
2. THE Gig_Card in Hoster mode SHALL display the gig title, date, and count of musicians who have accepted that gig
3. WHEN a Hoster taps a Gig_Card, THE App SHALL navigate to a hoster gig detail screen displaying the gig title, venue name, address, date, start time, end time, genre, pay amount, description, and a list of musicians who accepted
4. IF a Hoster has no gigs in a Carousel section, THEN THE Dashboard SHALL display an empty-state message indicating no gigs exist for that section

### Requirement 7: Role Switching

**User Story:** As a user, I want to switch between Musician and Hoster views, so that I can use both sides of the platform.

#### Acceptance Criteria

1. THE App SHALL provide a Role_Switcher accessible from the Profile tab that displays the currently active role (Musician or Hoster)
2. WHEN a user activates the Role_Switcher, THE App SHALL toggle between Musician mode and Hoster mode and navigate the user to the Home tab
3. WHEN the role changes, THE Dashboard SHALL update to display the appropriate carousels for the selected role within 300ms
4. THE App SHALL persist the selected role across app sessions using local storage
5. IF no persisted role exists on app launch, THEN THE App SHALL default to Musician mode

### Requirement 8: Mock Data Layer

**User Story:** As a developer, I want local mock data for all entities, so that I can develop and test the UI without requiring a live backend.

#### Acceptance Criteria

1. THE Mock_Data_Layer SHALL provide at least 10 sample gigs, each containing a unique ID, title, venue name, full address, geographic coordinates (latitude and longitude), date, start time, end time, genre, pay amount, description, and status, with at least 5 distinct genres, at least 5 distinct venues, and dates spanning both past and future relative to the current date
2. THE Mock_Data_Layer SHALL provide at least 3 sample musician profiles and 2 sample hoster profiles, where each profile contains a unique ID, display name, and role designation
3. THE Mock_Data_Layer SHALL expose functions for reading all gigs, reading a single gig by ID, creating a new gig record in memory, and updating an existing gig record by ID, where each function returns the resulting gig record or array of gig records
4. THE Mock_Data_Layer SHALL support filtering gigs by status (available, accepted, past), where the sample data includes at least 2 gigs in each status category
5. IF a read or update function is called with an ID that does not exist in the mock data, THEN THE Mock_Data_Layer SHALL return a null value indicating no record was found
6. IF a create function is called without all required gig fields (title, venue name, address, date, start time, end time, genre, pay amount), THEN THE Mock_Data_Layer SHALL return a validation error indicating the missing fields

### Requirement 9: Theming and Visual Design

**User Story:** As a user, I want a polished, modern interface with dark and light mode support, so that the app feels professional and matches my device preferences.

#### Acceptance Criteria

1. THE App SHALL support both light and dark color schemes using the existing theme token system defined in the Colors constant (light and dark key sets)
2. WHEN the App launches, THE App SHALL detect the device system color scheme preference and apply the corresponding light or dark theme; IF no system preference is set, THEN THE App SHALL default to the dark color scheme
3. THE App SHALL reference only the token values from the Colors, Fonts, and Spacing constants for all color, typography, and spacing values across all screens, with no hardcoded style values for those properties
4. THE Gig_Card components SHALL use a minimum elevation of 2 (Android) or a border with a minimum width of 1 pixel using the backgroundElement token color to create a visible boundary between the card and the background
5. WHEN the device system color scheme changes while the App is in the foreground, THE App SHALL apply the updated color scheme without requiring a restart

### Requirement 10: Cross-Platform Compatibility

**User Story:** As a user, I want to use Transient on iOS, Android, or web, so that I can access gigs from any device.

#### Acceptance Criteria

1. THE App SHALL render all screens on iOS, Android, and web platforms with no overlapping UI elements, no text truncation, and all interactive elements visible and reachable without horizontal scrolling on viewports 320px wide or larger
2. THE App SHALL use platform-adaptive components for maps, using react-native-maps on mobile and a web-compatible alternative on web
3. IF a platform-specific feature is unavailable on the current device, THEN THE App SHALL display a visible inline message indicating which feature is unavailable and hide the associated interactive controls, without causing an application crash or unhandled exception
4. THE App SHALL support a minimum viewport width of 320px on web and render without layout breakage on standard iOS and Android device sizes from 4-inch screens upward
