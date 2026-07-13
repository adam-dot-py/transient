/**
 * Pure validation functions for musician profile data.
 *
 * All functions are pure — no side effects, no mutations.
 * They validate inputs and return structured results indicating
 * success or failure with descriptive error messages.
 */

import type { Genre, MusicLink } from '@/types';

/** The complete set of valid genre values */
const VALID_GENRES: Genre[] = [
  'rock',
  'jazz',
  'blues',
  'electronic',
  'folk',
  'classical',
  'pop',
  'country',
];

/**
 * Validates the core profile fields: display name and genres.
 *
 * Rules:
 * - displayName must be non-empty after trimming
 * - genres must contain at least one item
 * - All genres must be from the valid genre list
 *
 * Returns an object with isValid flag and a record of field-level errors.
 */
export function validateProfile(input: {
  displayName: string;
  genres: Genre[];
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.displayName || input.displayName.trim().length === 0) {
    errors.displayName = 'Display name is required';
  }

  if (!input.genres || input.genres.length === 0) {
    errors.genres = 'At least one genre is required';
  } else if (!input.genres.every((g) => VALID_GENRES.includes(g))) {
    errors.genres = 'Invalid genre selected';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates a bio string.
 *
 * Rules:
 * - Bio must be 500 characters or fewer
 * - Empty string is valid (bio is optional)
 */
export function validateBio(bio: string): { isValid: boolean; error?: string } {
  if (bio.length > 500) {
    return { isValid: false, error: 'Bio must be 500 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validates an array of music links.
 *
 * Rules:
 * - At most 10 links allowed
 * - Each link must have a valid URL (starts with http:// or https://)
 * - Each link must have a non-empty title
 */
export function validateMusicLinks(links: MusicLink[]): {
  isValid: boolean;
  error?: string;
} {
  if (links.length > 10) {
    return { isValid: false, error: 'Maximum of 10 music links allowed' };
  }

  for (const link of links) {
    if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
      return { isValid: false, error: 'Invalid URL format' };
    }
    if (!link.title || link.title.trim().length === 0) {
      return { isValid: false, error: 'Link title is required' };
    }
  }

  return { isValid: true };
}

/**
 * Validates a profile image file.
 *
 * Rules:
 * - File size must be ≤ 5MB (5,242,880 bytes)
 * - MIME type must be 'image/jpeg' or 'image/png'
 */
export function validateProfileImage(file: {
  size: number;
  mimeType: string;
}): { isValid: boolean; error?: string } {
  const MAX_SIZE = 5_242_880; // 5MB in bytes

  if (file.size > MAX_SIZE) {
    return { isValid: false, error: 'Image must be 5MB or less' };
  }

  if (file.mimeType !== 'image/jpeg' && file.mimeType !== 'image/png') {
    return { isValid: false, error: 'Only JPEG and PNG images are allowed' };
  }

  return { isValid: true };
}
