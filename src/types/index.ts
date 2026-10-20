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
  'rock' | 'jazz' | 'blues' | 'electronic' | 'folk' | 'classical' | 'pop' | 'country';

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
  /**
   * Optional hero/card image for the gig (a storage path or URL). When null or
   * absent the UI falls back to the gradient placeholder. Mirrors the nullable
   * `profiles.avatar_url` convention.
   */
  imageUrl?: string | null;
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
  /** Optional image for the gig (local uri in mock mode, storage path/URL live). */
  imageUrl?: string;
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
  /** Home latitude (degrees, WGS84). Null/undefined = no location (excluded from Amplify radius). */
  latitude?: number | null;
  /** Home longitude (degrees, WGS84). Null/undefined = no location. */
  longitude?: number | null;
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

/** Lifecycle status of a musician's payout for a gig */
export type GigPaymentStatus = 'pending' | 'paid';

/**
 * A payout to an accepted musician for performing a gig.
 *
 * This is the musician-facing payment record (distinct from an Amplify boost
 * purchase) and the source data for generating an invoice. Amounts are stored
 * in PENCE (gig.pay is whole pounds). `invoiceNumber` is assigned when the
 * payment is first invoiced; `paidAt` is set once the payment is `paid`.
 */
export interface GigPayment {
  id: string;
  gigId: string;
  musicianId: string;
  /** Payout amount in pence (e.g. £250.00 => 25000). */
  amountPence: number;
  /** ISO currency code, e.g. 'gbp'. */
  currency: string;
  status: GigPaymentStatus;
  /** Assigned when first invoiced; null until then. */
  invoiceNumber: string | null;
  /** ISO 8601 timestamp set when the payment became 'paid'; null otherwise. */
  paidAt: string | null;
  /** ISO 8601 timestamp of when the payment record was created. */
  createdAt: string;
}

/** A named party on an invoice (seller or buyer) with a postal address. */
export interface InvoiceParty {
  name: string;
  /** Address rendered one line per array element. */
  addressLines: string[];
  email?: string;
}

/**
 * A professional invoice assembled from a gig, its parties, and a paid payout.
 *
 * All monetary fields are in PENCE to avoid floating-point rounding. The seller
 * is the musician who performed; the buyer is the hoster/venue who paid.
 */
export interface Invoice {
  /** Human-readable invoice number, e.g. 'INV-20240131-AB12CD'. */
  invoiceNumber: string;
  /** ISO 8601 date the invoice was issued. */
  issueDate: string;
  /** The musician being paid. */
  seller: InvoiceParty;
  /** The hoster/venue paying. */
  buyer: InvoiceParty;
  gigTitle: string;
  /** ISO 8601 date of the gig (YYYY-MM-DD). */
  gigDate: string;
  gigStartTime: string;
  gigEndTime: string;
  venueName: string;
  /** Venue address rendered as a single display string. */
  venueAddress: string;
  description: string;
  lineItems: { description: string; amountPence: number }[];
  subtotalPence: number;
  totalPence: number;
  /** ISO currency code, e.g. 'gbp'. */
  currency: string;
  /** Short note about tax/VAT treatment. */
  taxNote: string;
  /** Always 'paid' — an invoice is only generated for a paid gig. */
  paymentStatus: 'paid';
  /** Reference derived from the payment id, for reconciliation. */
  paymentReference: string;
  /** ISO 8601 timestamp the payment was settled. */
  paidAt: string;
}

/** AsyncStorage key constants */
export const STORAGE_KEYS = {
  ROLE: 'transient:role',
  RECENTLY_VIEWED: 'transient:recently-viewed',
  THEME: 'transient:theme',
} as const;
