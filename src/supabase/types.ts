/**
 * Supabase Database TypeScript types.
 *
 * These types represent the Supabase table schemas and serve as the
 * contract between local mock data (development) and Supabase (test/production).
 *
 * Each table is represented with Row, Insert, and Update variants:
 * - Row: the full shape returned from a SELECT query
 * - Insert: required fields for INSERT (auto-generated fields omitted)
 * - Update: partial shape for UPDATE (all fields optional except id)
 */

// ─── Supporting Types ────────────────────────────────────────────────────────

/** A music platform link (Apple Music or Google Music) */
export interface MusicLink {
  platform: 'apple_music' | 'google_music';
  url: string;
  title: string;
}

// ─── Table Row Types ─────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  display_name: string;
  role: 'musician' | 'hoster';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  display_name: string;
  role: 'musician' | 'hoster';
  avatar_url?: string | null;
}

export interface ProfileUpdate {
  display_name?: string;
  role?: 'musician' | 'hoster';
  avatar_url?: string | null;
}

export interface MusicianProfileRow {
  id: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  genres: string[];
  music_links: MusicLink[];
  updated_at: string;
}

export interface MusicianProfileInsert {
  id: string;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  genres?: string[];
  music_links?: MusicLink[];
}

export interface MusicianProfileUpdate {
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  genres?: string[];
  music_links?: MusicLink[];
}

export interface GigRow {
  id: string;
  hoster_id: string;
  title: string;
  description: string | null;
  venue_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
  date: string;
  start_time: string;
  end_time: string;
  genres: string[];
  pay: number;
  status: string;
  push_enabled: boolean;
  accepted_musician_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface GigInsert {
  id?: string;
  hoster_id: string;
  title: string;
  description?: string | null;
  venue_name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
  date: string;
  start_time: string;
  end_time: string;
  genres: string[];
  pay: number;
  status?: string;
  push_enabled?: boolean;
  accepted_musician_ids?: string[];
}

export interface GigUpdate {
  hoster_id?: string;
  title?: string;
  description?: string | null;
  venue_name?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  postcode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  genres?: string[];
  pay?: number;
  status?: string;
  push_enabled?: boolean;
  accepted_musician_ids?: string[];
}

export interface ExampleSongRow {
  id: string;
  gig_id: string;
  title: string;
  artist: string;
  sort_order: number;
}

export interface ExampleSongInsert {
  id?: string;
  gig_id: string;
  title: string;
  artist: string;
  sort_order?: number;
}

export interface ExampleSongUpdate {
  gig_id?: string;
  title?: string;
  artist?: string;
  sort_order?: number;
}

export interface ApplicationRow {
  id: string;
  gig_id: string;
  musician_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationInsert {
  id?: string;
  gig_id: string;
  musician_id: string;
  status?: 'pending' | 'accepted' | 'declined';
  message?: string | null;
}

export interface ApplicationUpdate {
  status?: 'pending' | 'accepted' | 'declined';
  message?: string | null;
}

export interface PushTokenRow {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  created_at: string;
}

export interface PushTokenInsert {
  id?: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface PushTokenUpdate {
  user_id?: string;
  token?: string;
  platform?: 'ios' | 'android' | 'web';
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string> | null;
  read: boolean;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string> | null;
  read?: boolean;
}

export interface NotificationUpdate {
  type?: string;
  title?: string;
  body?: string;
  data?: Record<string, string> | null;
  read?: boolean;
}

export interface AmplifyPaymentRow {
  id: string;
  gig_id: string;
  user_id: string;
  stripe_payment_id: string;
  amount_pence: number;
  currency: string;
  radius_miles: 5 | 10 | 15 | 25;
  status: string;
  created_at: string;
}

export interface AmplifyPaymentInsert {
  id?: string;
  gig_id: string;
  user_id: string;
  stripe_payment_id: string;
  amount_pence?: number;
  currency?: string;
  radius_miles: 5 | 10 | 15 | 25;
  status?: string;
}

export interface AmplifyPaymentUpdate {
  status?: string;
}

// ─── Database Interface ──────────────────────────────────────────────────────

/**
 * Top-level Database type representing the full Supabase schema.
 *
 * Follows the Supabase client-library convention:
 * Database → public → Tables → TableName → { Row, Insert, Update }
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      musician_profiles: {
        Row: MusicianProfileRow;
        Insert: MusicianProfileInsert;
        Update: MusicianProfileUpdate;
      };
      gigs: {
        Row: GigRow;
        Insert: GigInsert;
        Update: GigUpdate;
      };
      example_songs: {
        Row: ExampleSongRow;
        Insert: ExampleSongInsert;
        Update: ExampleSongUpdate;
      };
      applications: {
        Row: ApplicationRow;
        Insert: ApplicationInsert;
        Update: ApplicationUpdate;
      };
      push_tokens: {
        Row: PushTokenRow;
        Insert: PushTokenInsert;
        Update: PushTokenUpdate;
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
      amplify_payments: {
        Row: AmplifyPaymentRow;
        Insert: AmplifyPaymentInsert;
        Update: AmplifyPaymentUpdate;
      };
    };
  };
}

// ─── Convenience Type Helpers ────────────────────────────────────────────────

/** Extract the Row type for a given table name */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Extract the Insert type for a given table name */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Extract the Update type for a given table name */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
