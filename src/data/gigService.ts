/**
 * Pure service functions for gig data operations.
 *
 * All functions are pure — they don't mutate input arrays and have no side effects.
 * They operate on plain data and return new values, making them easy to test
 * and compose in the context/state layer.
 */

import type { CreateGigInput, Genre, Gig, GigFilter, GigStatus, ValidationError } from '@/types';

/** All valid genre values for validation */
const VALID_GENRES: Genre[] = [
  'rock', 'jazz', 'blues', 'electronic', 'folk', 'classical', 'pop', 'country',
];

/**
 * Returns all gigs unchanged.
 * Exists as a named accessor for consistency in the service layer.
 */
export function getAllGigs(gigs: Gig[]): Gig[] {
  return gigs;
}

/**
 * Finds a gig by its ID.
 * Returns the matching gig or null if not found.
 */
export function getGigById(gigs: Gig[], id: string): Gig | null {
  return gigs.find((gig) => gig.id === id) ?? null;
}

/**
 * Creates a new gig from validated input.
 * Returns the new gig and updated array, or a ValidationError if input is invalid.
 *
 * - Generates a unique ID via crypto.randomUUID()
 * - Sets status to 'available' and acceptedMusicianIds to []
 */
export function createGig(
  gigs: Gig[],
  input: CreateGigInput,
  hosterId: string
): { gig: Gig; gigs: Gig[] } | { error: ValidationError } {
  const validationError = validateGigInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const newGig: Gig = {
    id: crypto.randomUUID(),
    title: input.title,
    venueName: input.venueName,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    city: input.city,
    postcode: input.postcode,
    country: input.country,
    latitude: 0,
    longitude: 0,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    genres: input.genres,
    pay: input.pay,
    description: input.description ?? '',
    status: 'available',
    hosterId,
    acceptedMusicianIds: [],
  };

  return { gig: newGig, gigs: [...gigs, newGig] };
}

/**
 * Updates a gig by ID with partial fields.
 * Returns the updated gig and new array, or null if the gig isn't found.
 * Does not mutate the original array or gig objects.
 */
export function updateGig(
  gigs: Gig[],
  id: string,
  updates: Partial<Gig>
): { gig: Gig; gigs: Gig[] } | null {
  const index = gigs.findIndex((gig) => gig.id === id);
  if (index === -1) {
    return null;
  }

  const updatedGig: Gig = { ...gigs[index], ...updates };
  const newGigs = [...gigs];
  newGigs[index] = updatedGig;

  return { gig: updatedGig, gigs: newGigs };
}

/**
 * Filters gigs by their status field.
 * Returns a new array containing only gigs matching the given status.
 */
export function filterByStatus(gigs: Gig[], status: GigStatus): Gig[] {
  return gigs.filter((gig) => gig.status === status);
}

/**
 * Adds a gig ID to the front of the recently viewed list.
 * - Deduplicates (removes the ID if it already exists in the list)
 * - Caps the list at `max` items (default 20)
 * - Returns a new array (does not mutate the input)
 */
export function addToRecentlyViewed(
  list: string[],
  gigId: string,
  max: number = 20
): string[] {
  const filtered = list.filter((id) => id !== gigId);
  return [gigId, ...filtered].slice(0, max);
}

/**
 * Validates a CreateGigInput, checking all required fields and constraints.
 *
 * Checks:
 * - Required fields: title, venueName, addressLine1, city, postcode, country, date, startTime, endTime, genres, pay
 * - Max-length: addressLine1 ≤100, addressLine2 ≤100, city ≤50, postcode ≤15, country ≤60
 * - addressLine2 is optional — only validate max-length if provided
 * - End time must be > start time (string comparison in HH:mm format)
 * - Date must not be in the past (compared to today)
 * - Pay must be between 1 and 99999
 * - Title max 100 characters
 *
 * Returns null if valid, or a ValidationError with all field errors if invalid.
 */
export function validateGigInput(
  input: Partial<CreateGigInput>
): ValidationError | null {
  const fields: Record<string, string> = {};

  // Required field checks
  if (!input.title || input.title.trim().length === 0) {
    fields.title = 'This field is required';
  } else if (input.title.length > 100) {
    fields.title = 'Title must be 100 characters or fewer';
  }

  if (!input.venueName || input.venueName.trim().length === 0) {
    fields.venueName = 'This field is required';
  }

  if (!input.addressLine1 || input.addressLine1.trim().length === 0) {
    fields.addressLine1 = 'This field is required';
  } else if (input.addressLine1.length > 100) {
    fields.addressLine1 = 'Address Line 1 must be 100 characters or fewer';
  }

  if (input.addressLine2 && input.addressLine2.length > 100) {
    fields.addressLine2 = 'Address Line 2 must be 100 characters or fewer';
  }

  if (!input.city || input.city.trim().length === 0) {
    fields.city = 'This field is required';
  } else if (input.city.length > 50) {
    fields.city = 'City must be 50 characters or fewer';
  }

  if (!input.postcode || input.postcode.trim().length === 0) {
    fields.postcode = 'This field is required';
  } else if (input.postcode.length > 15) {
    fields.postcode = 'Postcode must be 15 characters or fewer';
  }

  if (!input.country || input.country.trim().length === 0) {
    fields.country = 'This field is required';
  } else if (input.country.length > 60) {
    fields.country = 'Country must be 60 characters or fewer';
  }

  if (!input.date || input.date.trim().length === 0) {
    fields.date = 'This field is required';
  } else {
    // Date must not be in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(input.date + 'T00:00:00');
    if (inputDate < today) {
      fields.date = 'Date must be today or in the future';
    }
  }

  if (!input.startTime || input.startTime.trim().length === 0) {
    fields.startTime = 'This field is required';
  }

  if (!input.endTime || input.endTime.trim().length === 0) {
    fields.endTime = 'This field is required';
  }

  // End time must be > start time (string comparison works for HH:mm)
  if (input.startTime && input.endTime && !fields.startTime && !fields.endTime) {
    if (input.endTime <= input.startTime) {
      fields.endTime = 'End time must be after start time';
    }
  }

  if (!input.genres || !Array.isArray(input.genres) || input.genres.length === 0) {
    fields.genres = 'At least one genre is required';
  } else if (!input.genres.every((g) => VALID_GENRES.includes(g as Genre))) {
    fields.genres = 'Invalid genre selected';
  }

  if (input.pay === undefined || input.pay === null) {
    fields.pay = 'This field is required';
  } else if (input.pay < 1 || input.pay > 99999) {
    fields.pay = 'Pay must be between 1 and 99,999';
  }

  if (Object.keys(fields).length === 0) {
    return null;
  }

  return { type: 'validation', fields };
}

/**
 * Validates an array of example songs for a gig.
 *
 * Checks:
 * - Maximum of 10 songs allowed
 * - Each song must have a non-empty title and artist
 *
 * Returns { isValid: true } if valid, or { isValid: false, error: string } if invalid.
 */
export function validateExampleSongs(
  songs: { title: string; artist: string }[]
): { isValid: boolean; error?: string } {
  if (songs.length > 10) {
    return { isValid: false, error: 'Maximum of 10 example songs allowed' };
  }

  for (const song of songs) {
    if (!song.title || song.title.trim().length === 0) {
      return { isValid: false, error: 'Song title is required' };
    }
    if (!song.artist || song.artist.trim().length === 0) {
      return { isValid: false, error: 'Song artist is required' };
    }
  }

  return { isValid: true };
}

/**
 * Formats structured address fields into a single comma-separated display string.
 * Omits empty/undefined fields and their separators — no double commas or trailing commas.
 */
export function formatStructuredAddress(address: {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: string;
}): string {
  return [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.postcode,
    address.country,
  ]
    .filter((field) => field !== undefined && field.trim().length > 0)
    .join(', ');
}

/**
 * Returns true if lat/lng represent a valid, non-zero geographic coordinate.
 * Valid: latitude in [-90, 90], longitude in [-180, 180], both non-zero.
 */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  if (latitude === 0 || longitude === 0) {
    return false;
  }
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Formats a numeric pay amount as a currency string.
 * Example: 250 → "$250.00"
 */
export function formatPay(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Truncates a title at the given max length (default 40), appending "..." if truncated.
 * Returns the original string unchanged if it's within the limit.
 */
export function truncateTitle(title: string, max: number = 40): string {
  if (title.length <= max) {
    return title;
  }
  return title.slice(0, max) + '...';
}

/**
 * Returns the Monday 00:00:00 of the week containing the given date.
 *
 * Uses ISO week convention where Monday is the first day of the week.
 * The returned date is always <= the input date.
 */
export function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  // We want Monday as day 0 of the week, so adjust:
  // Monday=1 → offset 0, Tuesday=2 → offset 1, ..., Sunday=0 → offset 6
  const day = result.getDay();
  const diff = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - diff);

  return result;
}

/**
 * Truncates a genres array to at most `max` items, preserving order.
 * Returns the first `max` genres from the input array.
 * If the input has `max` or fewer items, returns the full array unchanged.
 */
export function truncateGenres(genres: string[], max: number = 2): string[] {
  return genres.slice(0, max);
}

/**
 * Filters gigs by time range based on the given filter value.
 *
 * - 'all': returns the full input array
 * - 'today': returns gigs whose date matches today's local date
 * - 'thisWeek': returns gigs within the current Monday–Sunday range
 * - 'nextWeek': returns gigs within the next Monday–Sunday range
 * - Any other value: returns an empty array
 *
 * The gig `date` field is expected in ISO 8601 format (YYYY-MM-DD).
 * Order of elements is preserved from the input array.
 */
export function filterGigsByTimeRange(gigs: Gig[], filter: GigFilter): Gig[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filter) {
    case 'all':
      return gigs;

    case 'today':
      return gigs.filter((g) => {
        const gigDate = new Date(g.date + 'T00:00:00');
        return gigDate.getTime() === today.getTime();
      });

    case 'thisWeek': {
      const startOfWeek = getStartOfWeek(today);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return gigs.filter((g) => {
        const gigDate = new Date(g.date + 'T00:00:00');
        return gigDate >= startOfWeek && gigDate <= endOfWeek;
      });
    }

    case 'nextWeek': {
      const nextWeekStart = getStartOfWeek(today);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
      return gigs.filter((g) => {
        const gigDate = new Date(g.date + 'T00:00:00');
        return gigDate >= nextWeekStart && gigDate <= nextWeekEnd;
      });
    }

    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return gigs.filter((g) => {
        const gigDate = new Date(g.date + 'T00:00:00');
        return gigDate >= startOfMonth && gigDate <= endOfMonth;
      });
    }

    default:
      return [];
  }
}
