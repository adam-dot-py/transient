# Requirements Document

## Introduction

This specification covers four unimplemented user stories for Transient — the music gigging marketplace app. These features transform the existing prototype (with mock data, stub screens, and no auth) into a functional platform where musicians can build profiles, hosts can create gigs and review applicants, users can authenticate via social logins, and push notifications connect musicians to new opportunities.

All backend data is managed through Supabase (PostgreSQL, Auth, Realtime, Storage). Development uses local mock data with Supabase schema definitions serving as the contract for production integration. Schema definitions are documented in this spec and tracked in a dedicated `src/supabase/` directory.

## Glossary

- **App**: The Transient cross-platform mobile application (iOS, Android, web)
- **Musician_User**: A user operating the app in the musician role, browsing and applying for gigs
- **Host_User**: A user operating the app in the hoster role, creating gigs and reviewing applications
- **Auth_System**: The authentication subsystem powered by Supabase Auth, handling sign-up, login, and session management
- **Profile_Service**: The module responsible for reading and writing musician profile data to Supabase
- **Gig_Service**: The module responsible for creating, reading, updating, and querying gig listings
- **Application_Service**: The module responsible for managing gig applications (submit, review, approve, deny)
- **Notification_Service**: The subsystem responsible for sending and receiving push notifications via expo-notifications and Supabase Edge Functions
- **Schema_Registry**: The designated directory (`src/supabase/`) containing TypeScript type definitions and documentation of all Supabase table schemas, RLS policies, and storage buckets
- **Social_Provider**: An external OAuth identity provider (Apple, Google, or Facebook)
- **Push_Token**: The device-specific Expo push notification token registered with the Notification_Service
- **Music_Link**: A URL reference to an Apple Music or Google Music playlist or song

## Requirements

### Requirement 1: Social Login and Authentication

**User Story:** As an app user, I want to sign up and log in via Apple, Google, Facebook, or email/password, so that access is quick and secure.

#### Acceptance Criteria

1. THE Auth_System SHALL support sign-up and login via Apple, Google, and Facebook Social_Providers using Supabase Auth OAuth flows
2. THE Auth_System SHALL support sign-up and login via email and password as an alternative to social login
3. WHEN a user opens the App without an active session, THE Auth_System SHALL redirect the user to the login screen before granting access to authenticated routes
4. WHEN a user successfully authenticates, THE Auth_System SHALL store the session token securely and navigate to the main tab navigator
5. WHEN a user taps a Social_Provider button, THE Auth_System SHALL initiate the OAuth flow using Supabase Auth and the platform-appropriate redirect (universal links on iOS, intent filters on Android, redirect URI on web)
6. IF authentication fails due to network error or provider rejection, THEN THE Auth_System SHALL display a user-visible error message describing the failure reason
7. WHEN a user taps the sign-out button, THE Auth_System SHALL revoke the session and redirect to the login screen
8. THE Auth_System SHALL persist the session across app restarts using Supabase Auth session refresh tokens
9. WHEN a new user completes their first authentication, THE Auth_System SHALL create a corresponding row in the `profiles` table with the user ID from Supabase Auth

### Requirement 2: Musician Profile

**User Story:** As a musician user, I want to build a profile with a picture, bio, location, genres, and music links, so that host users can evaluate me when I apply for gigs.

#### Acceptance Criteria

1. THE Profile_Service SHALL allow a Musician_User to upload a profile picture (JPEG or PNG, max 5 MB) stored in Supabase Storage bucket `profile-pictures`
2. THE Profile_Service SHALL allow a Musician_User to set a bio text of up to 500 characters
3. THE Profile_Service SHALL allow a Musician_User to set a location consisting of city and country
4. THE Profile_Service SHALL allow a Musician_User to select one or more genres from the predefined genre list (rock, jazz, blues, electronic, folk, classical, pop, country)
5. THE Profile_Service SHALL allow a Musician_User to add up to 10 Music_Links (Apple Music or Google Music URLs) representing songs or playlists in their repertoire
6. WHEN a Musician_User saves their profile, THE Profile_Service SHALL validate all fields and persist the data to the `musician_profiles` table in Supabase
7. IF a required field (display name, at least one genre) is missing, THEN THE Profile_Service SHALL display a field-level validation error and prevent saving
8. WHEN a Host_User views a musician's application, THE App SHALL display the musician's full profile including picture, bio, location, genres, and Music_Links
9. THE Profile_Service SHALL display the current profile data when the Musician_User navigates to the Profile tab
10. WHEN a Musician_User updates their profile picture, THE Profile_Service SHALL replace the previous image in Supabase Storage and update the `avatar_url` field

### Requirement 3: Gig Creation

**User Story:** As a host user, I want to create gig opportunities with full details including example songs, so that suitable musicians can discover and apply for them.

#### Acceptance Criteria

1. WHEN a Host_User navigates to the Create tab, THE Gig_Service SHALL display the gig creation form with fields for title, description, offered price, location, genres required, date, start time, end time, and example songs
2. THE Gig_Service SHALL validate the gig creation form requiring: title (1–100 characters), location (venue name, address, city, postcode, country), at least one genre, date (must be in the future), start time, end time (must be after start time), and pay (1–99999)
3. IF validation fails, THEN THE Gig_Service SHALL display field-level error messages and prevent submission
4. WHEN a Host_User submits a valid gig creation form, THE Gig_Service SHALL persist the gig to the `gigs` table with status `available` and the authenticated user as `hoster_id`
5. THE Gig_Service SHALL allow a Host_User to add up to 10 example song references (title and artist pairs) to indicate desired repertoire
6. THE Gig_Service SHALL allow a Host_User to enable push notification delivery for the gig via a toggle, storing the preference in the `push_enabled` column
7. WHEN a Host_User views a gig they created, THE Gig_Service SHALL display a list of applications with musician profiles and allow the host to approve or deny each application
8. WHEN a Host_User approves an application, THE Application_Service SHALL update the application status to `accepted` and notify the Musician_User
9. WHEN a Host_User denies an application, THE Application_Service SHALL update the application status to `declined` and notify the Musician_User
10. THE Gig_Service SHALL geocode the provided address into latitude and longitude coordinates for map display

### Requirement 4: Push Notifications

**User Story:** As a musician user, I want to receive push notifications for new gigs matching my profile, so that I can quickly discover and apply for relevant opportunities.

#### Acceptance Criteria

1. WHEN a Musician_User grants notification permissions, THE Notification_Service SHALL register the device Push_Token with Supabase in the `push_tokens` table
2. WHEN a Host_User creates a gig with push notifications enabled, THE Notification_Service SHALL send push notifications to Musician_Users whose genre preferences overlap with the gig's required genres and whose location is within the gig's area
3. THE Notification_Service SHALL include in the push notification payload: gig title, venue name, date, pay, and genres
4. WHEN a Musician_User taps a push notification, THE App SHALL navigate to the gig detail screen showing the full gig overview with location map
5. IF a Musician_User has not granted notification permissions, THEN THE Notification_Service SHALL display an in-app prompt explaining the benefits and requesting permission
6. WHEN a Musician_User's application is approved or denied, THE Notification_Service SHALL send a push notification with the decision and gig details
7. THE Notification_Service SHALL persist notification history in the `notifications` table so Musician_Users can view past notifications in the Activity tab
8. IF push notification delivery fails due to an invalid Push_Token, THEN THE Notification_Service SHALL remove the stale token from the `push_tokens` table

### Requirement 5: Musician Application Flow (Host Perspective)

**User Story:** As a host user, I want to review, approve, or deny musician applications for my gigs, so that I can choose the right performer.

#### Acceptance Criteria

1. WHEN a Musician_User applies to a gig, THE Application_Service SHALL create an application record in the `applications` table with status `pending`, linking the musician's profile and the gig
2. WHEN a Host_User views their gig's applications, THE Application_Service SHALL display each application showing the musician's display name, profile picture, genres, bio summary, and Music_Links
3. THE Application_Service SHALL allow a Host_User to tap an application to view the musician's full profile
4. WHEN a Host_User approves an application, THE Application_Service SHALL update the status to `accepted` and add the musician's ID to the gig's `accepted_musician_ids` array
5. WHEN a Host_User denies an application, THE Application_Service SHALL update the status to `declined`
6. THE Application_Service SHALL prevent a Musician_User from applying to the same gig more than once
7. WHEN all positions for a gig are filled (gig moves to `accepted` status), THE Application_Service SHALL automatically decline remaining pending applications and notify affected musicians

### Requirement 6: Supabase Schema Registry

**User Story:** As the development team, I want a designated area tracking all Supabase schema definitions, so that frontend mock data and backend implementation share a single source of truth.

#### Acceptance Criteria

1. THE Schema_Registry SHALL be located at `src/supabase/` and contain TypeScript type definitions for all Supabase tables
2. THE Schema_Registry SHALL document the following tables: `profiles`, `musician_profiles`, `gigs`, `applications`, `push_tokens`, `notifications`, `example_songs`
3. THE Schema_Registry SHALL define Row-Level Security (RLS) policy descriptions for each table
4. THE Schema_Registry SHALL define the Supabase Storage bucket configuration for `profile-pictures`
5. THE Schema_Registry SHALL include a `schema.sql` reference file documenting the complete DDL for all tables, indexes, and RLS policies
6. WHEN a new table or column is added to the Supabase schema, THE Schema_Registry SHALL be updated before any code references the new structure
7. THE Schema_Registry SHALL export TypeScript types that align with the existing `src/types/index.ts` domain model, extending it for database-specific fields (created_at, updated_at, foreign keys)

---

## Supabase Schema Reference

The following tables define the data model. These serve as the contract between local mock data (development) and Supabase (test/production).

### Table: `profiles`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, FK → auth.users(id) | Supabase Auth user ID |
| display_name | text | NOT NULL | User's display name |
| role | text | NOT NULL, CHECK (role IN ('musician', 'hoster')) | Active role |
| avatar_url | text | NULLABLE | URL to profile picture in Storage |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Account creation timestamp |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last profile update |

**RLS:** Users can read any profile. Users can update only their own profile.

### Table: `musician_profiles`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, FK → profiles(id) | Profile ID |
| bio | text | NULLABLE, max 500 chars | Musician's biography |
| city | text | NULLABLE | Musician's city |
| country | text | NULLABLE | Musician's country |
| genres | text[] | NOT NULL, DEFAULT '{}' | Array of genre slugs |
| music_links | jsonb | NOT NULL, DEFAULT '[]' | Array of {platform, url, title} objects |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last update timestamp |

**RLS:** Any authenticated user can read musician profiles. Only the profile owner can update.

### Table: `gigs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Gig unique ID |
| hoster_id | uuid | FK → profiles(id), NOT NULL | Creating host's profile ID |
| title | text | NOT NULL, max 100 chars | Gig title |
| description | text | NULLABLE, max 2000 chars | Full description |
| venue_name | text | NOT NULL, max 100 chars | Venue name |
| address_line1 | text | NOT NULL, max 100 chars | Street address |
| address_line2 | text | NULLABLE, max 100 chars | Address line 2 |
| city | text | NOT NULL, max 50 chars | City |
| postcode | text | NOT NULL, max 15 chars | Postal code |
| country | text | NOT NULL, max 60 chars | Country |
| latitude | double precision | NOT NULL | Geocoded latitude |
| longitude | double precision | NOT NULL | Geocoded longitude |
| date | date | NOT NULL | Gig date |
| start_time | time | NOT NULL | Start time |
| end_time | time | NOT NULL | End time |
| genres | text[] | NOT NULL | Required genres |
| pay | integer | NOT NULL, CHECK (pay BETWEEN 1 AND 99999) | Offered pay |
| status | text | NOT NULL, DEFAULT 'available' | available, accepted, past |
| push_enabled | boolean | NOT NULL, DEFAULT false | Send push notifications |
| accepted_musician_ids | uuid[] | NOT NULL, DEFAULT '{}' | Accepted musician IDs |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last update |

**RLS:** Anyone authenticated can read available gigs. Only the hoster can update/delete their gigs.

### Table: `example_songs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Song reference ID |
| gig_id | uuid | FK → gigs(id) ON DELETE CASCADE | Parent gig |
| title | text | NOT NULL, max 200 chars | Song title |
| artist | text | NOT NULL, max 200 chars | Artist name |
| sort_order | integer | NOT NULL, DEFAULT 0 | Display order |

**RLS:** Readable by all authenticated users. Writable only by the gig's hoster.

### Table: `applications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Application ID |
| gig_id | uuid | FK → gigs(id) ON DELETE CASCADE | Target gig |
| musician_id | uuid | FK → profiles(id), NOT NULL | Applying musician |
| status | text | NOT NULL, DEFAULT 'pending' | pending, accepted, declined |
| message | text | NULLABLE, max 500 chars | Optional cover message |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Application timestamp |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last status change |

**RLS:** Musicians can read their own applications. Hosters can read applications for their gigs. Only the musician can create. Only the hoster can update status.
**Unique constraint:** (gig_id, musician_id) — prevents duplicate applications.

### Table: `push_tokens`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Token record ID |
| user_id | uuid | FK → profiles(id), NOT NULL | Token owner |
| token | text | NOT NULL, UNIQUE | Expo push token string |
| platform | text | NOT NULL | ios, android, or web |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Registration timestamp |

**RLS:** Users can read/write only their own tokens.

### Table: `notifications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Notification ID |
| user_id | uuid | FK → profiles(id), NOT NULL | Recipient |
| type | text | NOT NULL | new_gig, application_approved, application_declined |
| title | text | NOT NULL | Notification title |
| body | text | NOT NULL | Notification body text |
| data | jsonb | NULLABLE | Payload (gig_id, application_id, etc.) |
| read | boolean | NOT NULL, DEFAULT false | Read status |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Sent timestamp |

**RLS:** Users can read only their own notifications.

### Storage Bucket: `profile-pictures`

- **Bucket name:** `profile-pictures`
- **Public:** No (requires auth)
- **Max file size:** 5 MB
- **Allowed MIME types:** image/jpeg, image/png
- **Path pattern:** `{user_id}/avatar.{ext}`
- **RLS:** Users can upload/update/delete only files in their own `{user_id}/` prefix. Any authenticated user can read any file (for viewing other profiles).
