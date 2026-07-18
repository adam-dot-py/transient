/**
 * Master list of all genres supported by the app.
 *
 * This file is the single source of truth for genre options.
 * Add new genres here and they'll appear in the genre picker automatically.
 * Keep alphabetically sorted within each category.
 */

import type { Genre } from '@/types';

export const ALL_GENRES: Genre[] = [
  'blues',
  'classical',
  'country',
  'electronic',
  'folk',
  'jazz',
  'pop',
  'rock',
];

/** Display labels for each genre (capitalized) */
export const GENRE_LABELS: Record<Genre, string> = {
  blues: 'Blues',
  classical: 'Classical',
  country: 'Country',
  electronic: 'Electronic',
  folk: 'Folk',
  jazz: 'Jazz',
  pop: 'Pop',
  rock: 'Rock',
};
