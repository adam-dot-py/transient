# Bugfix Requirements Document

## Introduction

Three UI/navigation bugs have been identified in the Transient app following the SwiftUI alignment redesign. These bugs impact core usability: (1) users cannot navigate back from the gig detail/accept screen, (2) the Explore tab's title is misaligned relative to Home and Activity, and (3) hosters have lost access to the Create Gig flow. All three regressions affect the basic navigation and layout consistency of the app.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user navigates to the gig detail screen (`/gig/[id]`) THEN the system provides no back button or navigation affordance to return to the previous screen

1.2 WHEN the Explore tab is displayed THEN the "Explore" section title renders at a different vertical position than "Home" and "Activity" titles on their respective tabs, despite all three using the SectionTitle component

1.3 WHEN a user is in the hoster role THEN the system does not provide accessible navigation to the Create Gig flow from the tab structure (the HosterDashboard lacks the SectionTitle header and the Create Gig functionality is not consistently reachable after the redesign)

### Expected Behavior (Correct)

2.1 WHEN a user navigates to the gig detail screen (`/gig/[id]`) THEN the system SHALL display a back button or navigation affordance that returns the user to the previous screen

2.2 WHEN the Explore tab is displayed THEN the "Explore" section title SHALL render at the same vertical position as "Home" and "Activity" titles on their respective tabs (consistent safe area inset handling)

2.3 WHEN a user is in the hoster role THEN the system SHALL provide clear and accessible navigation to the Create Gig screen (`/gig/create`) with a consistent header layout matching other tabs

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user is on the Home tab (musician role) THEN the system SHALL CONTINUE TO display the SectionTitle, filter chips, and gig carousels with correct layout and safe area handling

3.2 WHEN a user is on the Activity tab THEN the system SHALL CONTINUE TO display the SectionTitle and application list with correct layout and safe area handling

3.3 WHEN a user taps "Accept Gig" on the gig detail screen THEN the system SHALL CONTINUE TO accept the gig and show the confirmation banner

3.4 WHEN a user fills out and submits the Create Gig form THEN the system SHALL CONTINUE TO validate input, create the gig, and navigate back on success

3.5 WHEN a user switches roles via the profile screen THEN the system SHALL CONTINUE TO toggle between musician and hoster views correctly
