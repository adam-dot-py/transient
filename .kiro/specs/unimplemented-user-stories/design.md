# Design Document

## Overview

This design covers the implementation of four unimplemented user stories (Social Login, Musician Profile, Gig Creation, Push Notifications) plus the supporting Supabase Schema Registry and Application Management flow. The architecture follows the existing patterns: React Context for state, pure service functions for logic, and a mock-first development approach with Supabase schema as the contract.

## Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Expo Router                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ (auth)   │  │ (tabs)   │  │ gig/[id] │  │ profile/[id] │   │
│  │ login    │  │ index    │  │ detail   │  │ view         │   │
│  │ signup   │  │ explore  │  └──────────┘  └──────────────┘   │
│  └──────────┘  │ create   │                                     │
│                │ activity  │                                     │
│                │ profile   │                                     │
│                └──────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     Context Layer                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────────┐               │
│  │AuthContext│  │GigContext │  │ProfileContext │               │
│  └───────────┘  └───────────┘  └───────────────┘               │
│  ┌────────────────┐  ┌────────────────────┐                    │
│  │ApplicationCtx  │  │NotificationContext │                    │
│  └────────────────┘  └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                                 │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐         │
│  │authService│  │profileService│  │applicationService│         │
│  └───────────┘  └──────────────┘  └──────────────────┘         │
│  ┌──────────────────┐  ┌──────────────┐                        │
│  │notificationSvc   │  │gigService    │ (extended)             │
│  └──────────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│              Data Layer (Mock-first → Supabase)                   │
│  ┌────────────────┐  ┌────────────────────────────┐            │
│  │ src/supabase/  │  │ src/data/mock*.ts           │            │
│  │ schema types   │  │ (development mock data)     │            │
│  │ client config  │  └────────────────────────────┘            │
│  │ schema.sql     │                                             │
│  └────────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Auth-gated routing via Expo Router groups**: `(auth)` group for login/signup screens, `(tabs)` group for authenticated content. Root layout checks auth state and redirects accordingly.

2. **Mock-first development**: All services have a mock implementation that uses local data. The Supabase client is injected via a provider pattern, allowing easy swap from mock to real client.

3. **Extend existing patterns**: New contexts (AuthContext, ProfileContext, ApplicationContext, NotificationContext) follow the same pattern as existing GigContext and RoleContext.

4. **Schema Registry as source of truth**: `src/supabase/` contains TypeScript types generated from the schema, a schema.sql DDL file, and the Supabase client configuration. Mock data files in `src/data/` conform to these types.

5. **Gig.genre → Gig.genres (array)**: The existing `Gig` type uses a single `genre: Genre`. The schema and new gig creation form support multiple genres. The type will be updated to `genres: Genre[]` with backward compatibility in the UI.

6. **Pure service functions for testable logic**: Validation, matching, and state transitions are pure functions. Side effects (API calls, storage) are isolated in the context layer.

## Components and Interfaces

### New Files to Create

#### Authentication
- `src/app/(auth)/_layout.tsx` — Auth group layout (no tabs, stack navigation)
- `src/app/(auth)/login.tsx` — Login screen with social + email options
- `src/app/(auth)/signup.tsx` — Sign-up screen with email/password form
- `src/context/AuthContext.tsx` — Auth state, session management, sign-in/out methods
- `src/data/authService.ts` — Pure auth helper functions (validate email, session checks)

#### Musician Profile
- `src/app/(tabs)/profile.tsx` — Rewrite existing stub with full profile editor
- `src/app/profile/[id].tsx` — Public profile view (for hosts reviewing musicians)
- `src/context/ProfileContext.tsx` — Profile state, CRUD operations
- `src/data/profileService.ts` — Profile validation, data transformation functions
- `src/data/mockMusicianProfiles.ts` — Extended mock data with bio, genres, music links
- `src/components/ProfileEditor.tsx` — Form component for editing profile fields
- `src/components/MusicLinkList.tsx` — Display/edit list of music platform links
- `src/components/AvatarUploader.tsx` — Profile picture upload component
- `src/components/GenrePicker.tsx` — Multi-select genre picker

#### Gig Creation
- `src/app/(tabs)/create.tsx` — Rewrite existing stub with full creation form
- `src/components/ExampleSongList.tsx` — Add/remove example songs
- `src/components/GigGenrePicker.tsx` — Multi-genre picker for gig creation

#### Push Notifications
- `src/context/NotificationContext.tsx` — Notification state, permission management
- `src/data/notificationService.ts` — Notification matching logic, payload construction
- `src/data/mockNotifications.ts` — Mock notification data
- `src/hooks/useNotifications.ts` — Hook for registering tokens, handling incoming notifications
- `src/components/NotificationCard.tsx` — Notification list item in Activity tab

#### Application Management
- `src/context/ApplicationContext.tsx` — Application state, submit/approve/deny
- `src/data/applicationService.ts` — Application validation, state transitions
- `src/data/mockApplicationsExtended.ts` — Extended mock data with musician profiles
- `src/app/gig/[id]/applications.tsx` — Applications list for host view
- `src/components/ApplicationCard.tsx` — Application card showing musician summary
- `src/components/ApplicationActions.tsx` — Approve/deny action buttons

#### Supabase Schema Registry
- `src/supabase/types.ts` — TypeScript types for all Supabase tables (Database type)
- `src/supabase/client.ts` — Supabase client initialization (mock vs real)
- `src/supabase/schema.sql` — Complete DDL reference file
- `src/supabase/README.md` — Documentation of schema, RLS, and storage config

### Key Interfaces

```typescript
/** Extended musician profile with full data */
interface FullMusicianProfile {
  id: string;
  displayName: string;
  role: 'musician';
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  genres: Genre[];
  musicLinks: MusicLink[];
}

/** A music platform link (Apple Music or Google Music) */
interface MusicLink {
  platform: 'apple_music' | 'google_music';
  url: string;
  title: string;
}

/** An example song reference for a gig */
interface ExampleSong {
  id: string;
  title: string;
  artist: string;
  sortOrder: number;
}

/** Push notification record */
interface Notification {
  id: string;
  userId: string;
  type: 'new_gig' | 'application_approved' | 'application_declined';
  title: string;
  body: string;
  data: Record<string, string> | null;
  read: boolean;
  createdAt: string;
}

/** Extended application with musician profile info */
interface ApplicationWithProfile {
  id: string;
  gigId: string;
  musicianId: string;
  status: ApplicationStatus;
  message: string | null;
  createdAt: string;
  musician: FullMusicianProfile;
}

/** Auth session state */
interface AuthState {
  session: { accessToken: string; refreshToken: string; user: { id: string; email: string } } | null;
  isLoading: boolean;
  error: string | null;
}
```

### Files to Modify

- `src/types/index.ts` — Extend with new types (MusicLink, ExampleSong, Notification, etc.), update `Gig.genre` → `Gig.genres`
- `src/app/_layout.tsx` — Add AuthContext provider, auth guard logic
- `src/app/(tabs)/_layout.tsx` — Minor adjustments for notification badge from real data
- `src/app/(tabs)/activity.tsx` — Integrate with NotificationContext and ApplicationContext
- `src/data/mockGigs.ts` — Update to use `genres: Genre[]` array
- `src/data/mockProfiles.ts` — Extend with full musician profile data
- `src/data/gigService.ts` — Update for multi-genre support, add example songs handling
- `src/context/GigContext.tsx` — Add push_enabled support, integrate with ApplicationContext

## Data Models

### Supabase Tables (TypeScript representation)

```typescript
interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; role: 'musician' | 'hoster'; avatar_url: string | null; created_at: string; updated_at: string };
        Insert: Omit<Row, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Row, 'id'>>;
      };
      musician_profiles: {
        Row: { id: string; bio: string | null; city: string | null; country: string | null; genres: string[]; music_links: MusicLink[]; updated_at: string };
        Insert: Omit<Row, 'updated_at'>;
        Update: Partial<Omit<Row, 'id'>>;
      };
      gigs: {
        Row: { id: string; hoster_id: string; title: string; description: string | null; venue_name: string; address_line1: string; address_line2: string | null; city: string; postcode: string; country: string; latitude: number; longitude: number; date: string; start_time: string; end_time: string; genres: string[]; pay: number; status: string; push_enabled: boolean; accepted_musician_ids: string[]; created_at: string; updated_at: string };
      };
      example_songs: {
        Row: { id: string; gig_id: string; title: string; artist: string; sort_order: number };
      };
      applications: {
        Row: { id: string; gig_id: string; musician_id: string; status: 'pending' | 'accepted' | 'declined'; message: string | null; created_at: string; updated_at: string };
      };
      push_tokens: {
        Row: { id: string; user_id: string; token: string; platform: 'ios' | 'android' | 'web'; created_at: string };
      };
      notifications: {
        Row: { id: string; user_id: string; type: string; title: string; body: string; data: Record<string, string> | null; read: boolean; created_at: string };
      };
    };
  };
}
```

### Relationship Diagram

```
profiles (1) ──── (1) musician_profiles
    │
    ├── (1) ──── (N) gigs [hoster_id]
    │                  │
    │                  ├── (1) ──── (N) example_songs [gig_id]
    │                  │
    │                  └── (1) ──── (N) applications [gig_id]
    │                                      │
    ├── (1) ──── (N) applications [musician_id]
    │
    ├── (1) ──── (N) push_tokens [user_id]
    │
    └── (1) ──── (N) notifications [user_id]
```

## Error Handling

### Authentication Errors
- Network failures during OAuth → display "Unable to connect. Check your internet and try again."
- Provider rejection (user cancelled) → display "Sign in was cancelled."
- Invalid email/password → display field-level error "Invalid email or password."
- Session expired → silently refresh; if refresh fails, redirect to login

### Validation Errors
- All form validation uses field-level error messages (same pattern as existing `ValidationError` type)
- Errors displayed inline below the affected field
- Form submission blocked until all errors resolved

### Data Operation Errors
- Failed gig creation → display error banner, preserve form state
- Failed application submission → display error, allow retry
- Failed profile save → display error, preserve edits
- Failed image upload → display "Upload failed. Try a smaller image or check your connection."

### Push Notification Errors
- Permission denied → store preference, show in-app banner explaining benefits
- Invalid token → remove from push_tokens table silently
- Delivery failure → log for retry via Edge Function

## Correctness Properties

### Property 1: Profile Validation Completeness

**Validates: Requirements 2.6, 2.7**

For any musician profile input, the profile validation function returns success if and only if display_name is non-empty AND genres contains at least one valid genre from the predefined list.

```
∀ input: ProfileInput →
  validateProfile(input).isValid ↔ (
    input.displayName.trim().length > 0 ∧
    input.genres.length ≥ 1 ∧
    input.genres.every(g ∈ VALID_GENRES)
  )
```

### Property 2: Music Link Count Invariant

**Validates: Requirements 2.5**

For any musician profile, the music_links array has at most 10 entries. Adding a link when at capacity returns a validation error.

```
∀ profile, link →
  profile.musicLinks.length = 10 →
    addMusicLink(profile, link).isError = true
```

### Property 3: Bio Length Constraint

**Validates: Requirements 2.2**

For any string input as bio, validation passes if and only if the string length is ≤ 500 characters.

```
∀ bio: string →
  validateBio(bio).isValid ↔ bio.length ≤ 500
```

### Property 4: Application Uniqueness

**Validates: Requirements 5.6**

For any (gig_id, musician_id) pair, the application service prevents creation of a second application.

```
∀ gigId, musicianId, applications →
  applications.some(a ⇒ a.gigId = gigId ∧ a.musicianId = musicianId) →
    createApplication(applications, gigId, musicianId).isError = true
```

### Property 5: Application State Transition Validity

**Validates: Requirements 5.4, 5.5**

An application can only transition: pending → accepted, or pending → declined. No other transitions are valid.

```
∀ application, newStatus →
  updateApplicationStatus(application, newStatus).isValid →
    application.status = 'pending' ∧ (newStatus = 'accepted' ∨ newStatus = 'declined')
```

### Property 6: Approval Side Effects

**Validates: Requirements 5.4**

When an application is approved, the musician's ID is always added to the gig's accepted_musician_ids array, and no other musician IDs are affected.

```
∀ application, gig →
  approveApplication(application, gig) →
    result.gig.acceptedMusicianIds contains application.musicianId ∧
    result.gig.acceptedMusicianIds ⊇ gig.acceptedMusicianIds
```

### Property 7: Auto-Decline on Gig Fill

**Validates: Requirements 5.7**

When a gig transitions to 'accepted' status, all remaining pending applications for that gig have their status set to 'declined'.

```
∀ gig, applications →
  gig.status = 'accepted' →
    autoDeclinePending(applications, gig.id).every(
      a ⇒ a.gigId = gig.id ∧ a.status ≠ 'pending'
    )
```

### Property 8: Push Notification Genre Matching

**Validates: Requirements 4.2**

A musician receives a push notification for a new gig if and only if at least one of the musician's genres overlaps with the gig's required genres.

```
∀ musician, gig →
  shouldNotify(musician, gig) ↔
    musician.genres ∩ gig.genres ≠ ∅
```

### Property 9: Example Songs Count Invariant

**Validates: Requirements 3.5**

A gig has at most 10 example songs. Attempting to add beyond 10 returns a validation error.

```
∀ gig, song →
  gig.exampleSongs.length = 10 →
    addExampleSong(gig, song).isError = true
```

### Property 10: Gig Creation Multi-Genre Validation

**Validates: Requirements 3.2**

Gig creation requires at least one genre from the valid genre list. Validation passes if and only if genres array is non-empty and all elements are valid.

```
∀ input: CreateGigInput →
  validateGigGenres(input.genres).isValid ↔ (
    input.genres.length ≥ 1 ∧
    input.genres.every(g ∈ VALID_GENRES)
  )
```

### Property 11: Profile Image Validation

**Validates: Requirements 2.1**

A profile image upload passes validation if and only if the file size is ≤ 5MB and the MIME type is 'image/jpeg' or 'image/png'.

```
∀ file →
  validateProfileImage(file).isValid ↔ (
    file.size ≤ 5_242_880 ∧
    file.mimeType ∈ {'image/jpeg', 'image/png'}
  )
```

## Data Flow

### Authentication Flow

```
User opens app
  → RootLayout checks AuthContext.session
  → No session → Redirect to /(auth)/login
  → User taps Social Provider → authService.signInWithProvider()
  → Supabase OAuth flow → Returns session
  → AuthContext stores session → Navigate to /(tabs)
  → First-time user → Create profiles row
```

### Gig Application Flow

```
Musician views gig detail → Taps "Apply"
  → ApplicationContext.createApplication(gigId, musicianId, message)
  → Validates no existing application (uniqueness check)
  → Creates application with status 'pending'
  → NotificationContext sends notification to hoster

Host views gig → Navigates to applications list
  → ApplicationContext.getApplicationsForGig(gigId)
  → Host taps application → Views musician profile
  → Host taps "Approve" → ApplicationContext.approveApplication(appId)
    → Updates app status to 'accepted'
    → Adds musicianId to gig.acceptedMusicianIds
    → Sends notification to musician
  → Host taps "Deny" → ApplicationContext.denyApplication(appId)
    → Updates app status to 'declined'
    → Sends notification to musician
```

### Push Notification Flow

```
Host creates gig with push_enabled = true
  → Supabase Edge Function triggers on gigs INSERT
  → Queries musician_profiles for genre overlap
  → Queries push_tokens for matching musicians
  → Sends expo push notifications via Expo Push API
  → Stores notification records in notifications table

Musician receives push
  → expo-notifications handler fires
  → App navigates to /gig/[id] detail screen
```

## Testing Strategy

- **Property-based tests** (fast-check): Profile validation, application state transitions, genre matching, uniqueness constraints, count invariants
- **Unit tests** (jest): Service function behavior, data transformations
- **Component tests** (@testing-library/react-native): Form rendering, user interactions, navigation
- **Integration tests**: Auth flow with mocked Supabase client, full application flow with mocked data
