import type { HosterProfile, MusicianProfile } from '@/types';

/** 3 sample musician profiles for development */
export const MOCK_MUSICIANS: MusicianProfile[] = [
  {
    id: 'musician-1',
    displayName: 'Rae Holloway',
    role: 'musician',
  },
  {
    id: 'musician-2',
    displayName: 'Dex Cadence',
    role: 'musician',
  },
  {
    id: 'musician-3',
    displayName: 'Nola Vibe',
    role: 'musician',
  },
];

/** 2 sample hoster profiles for development */
export const MOCK_HOSTERS: HosterProfile[] = [
  {
    id: 'hoster-1',
    displayName: 'The Blue Note Lounge',
    role: 'hoster',
  },
  {
    id: 'hoster-2',
    displayName: 'Rooftop Sessions',
    role: 'hoster',
  },
];

/** The current user of the app (defaults to musician-1) */
export const CURRENT_USER: MusicianProfile = MOCK_MUSICIANS[0];
