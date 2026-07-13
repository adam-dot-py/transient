/**
 * Shared TypeScript interfaces and types for the Transient app.
 *
 * These types define the core domain model: gigs, users, roles,
 * and supporting structures used across the entire application.
 */

/** The two roles a user can operate in */
export type UserRole = 'musician' | 'hoster';

/** Lifecycle status of a gig */
export type GigStatus = 'available' | 'accepted' | 'past';

/** Supported music genres for gig categorization */
export type Genre =
  | 'rock'
  | 'jazz'
  | 'blues'
  | 'electronic'
  | 'folk'
  | 'classical'
  | 'pop'
  | 'country';

/** A single gig listing with all its metadata */
export interface Gig {
  id: string;
  title: string; // max 100 chars
  venueName: string; // max 100 chars
  addressLine1: string; // max 100 chars, required
  addressLine2?: string; // max 100 chars, optional
  city: string; // max 50 chars, required
  postcode: string; // max 15 chars, required
  country: string; // max 60 chars, required
  latitude: number;
  longitude: number;
  date: string; // ISO 8601 date (YYYY-MM-DD)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  genres: Genre[];
  pay: number; // numeric, 1–99999
  description: string; // max 500 chars for hoster-created, up to 2000 for display
  status: GigStatus;
  hosterId: string;
  acceptedMusicianIds: string[];
}

/** Input shape for creating a new gig (no id, status, or hosterId) */
export interface CreateGigInput {
  title: string;
  venueName: string;
  addressLine1: string; // max 100 chars, required
  addressLine2?: string; // max 100 chars, optional
  city: string; // max 50 chars, required
  postcode: string; // max 15 chars, required
  country: string; // max 60 chars, required
  date: string;
  startTime: string;
  endTime: string;
  genres: Genre[];
  pay: number;
  description?: string;
}

/** Validation error returned when gig input fails checks */
export interface ValidationError {
  type: 'validation';
  fields: Record<string, string>; // field name → error message
}

/** Profile for a user in the musician role */
export interface MusicianProfile {
  id: string;
  displayName: string;
  role: 'musician';
}

/** Profile for a user in the hoster role */
export interface HosterProfile {
  id: string;
  displayName: string;
  role: 'hoster';
}

/** Discriminated union of all user profile types */
export type UserProfile = MusicianProfile | HosterProfile;

/** Region descriptor for map centering and zoom */
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/** Status of a musician's application to a gig */
export type ApplicationStatus = 'pending' | 'accepted' | 'declined';

/** Time-based filter options for browsing gigs */
export type GigFilter = 'all' | 'today' | 'thisWeek' | 'nextWeek' | 'thisMonth';

/** A musician's application to a gig */
export interface Application {
  id: string;
  venue: string;
  date: string; // ISO 8601 date (YYYY-MM-DD)
  status: ApplicationStatus;
  gigId?: string; // Optional reference to a Gig id
}

/** A music platform link (Apple Music or Google Music) */
export interface MusicLink {
  platform: 'apple_music' | 'google_music';
  url: string;
  title: string;
}

/** Extended musician profile with full data */
export interface FullMusicianProfile {
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

/** An example song reference for a gig */
export interface ExampleSong {
  id: string;
  title: string;
  artist: string;
  sortOrder: number;
}

/** Push notification record */
export interface Notification {
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
export interface ApplicationWithProfile {
  id: string;
  gigId: string;
  musicianId: string;
  status: ApplicationStatus;
  message: string | null;
  createdAt: string;
  musician: FullMusicianProfile;
}

/** AsyncStorage key constants */
export const STORAGE_KEYS = {
  ROLE: 'transient:role',
  RECENTLY_VIEWED: 'transient:recently-viewed',
} as const;
