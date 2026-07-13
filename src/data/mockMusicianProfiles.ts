import type { FullMusicianProfile } from '@/types';

/** Extended mock musician profiles with full data for development */
export const mockMusicianProfiles: FullMusicianProfile[] = [
  {
    id: 'musician-1',
    displayName: 'Rae Holloway',
    role: 'musician',
    avatarUrl: null,
    bio: 'Singer-songwriter blending folk and indie rock. Gigging across London for five years with a focus on intimate acoustic sets.',
    city: 'London',
    country: 'United Kingdom',
    genres: ['folk', 'rock'],
    musicLinks: [
      {
        platform: 'apple_music',
        url: 'https://music.apple.com/gb/artist/rae-holloway/1234567890',
        title: 'Rae Holloway on Apple Music',
      },
      {
        platform: 'google_music',
        url: 'https://music.youtube.com/channel/UCraeholloway123',
        title: 'Rae Holloway on YouTube Music',
      },
    ],
  },
  {
    id: 'musician-2',
    displayName: 'Dex Cadence',
    role: 'musician',
    avatarUrl: null,
    bio: 'Electronic producer and live performer from Manchester. Specialises in deep house and ambient sets for club nights and festivals.',
    city: 'Manchester',
    country: 'United Kingdom',
    genres: ['electronic', 'jazz'],
    musicLinks: [
      {
        platform: 'apple_music',
        url: 'https://music.apple.com/gb/artist/dex-cadence/9876543210',
        title: 'Dex Cadence on Apple Music',
      },
    ],
  },
  {
    id: 'musician-3',
    displayName: 'Nola Vibe',
    role: 'musician',
    avatarUrl: null,
    bio: 'Jazz and blues vocalist based in Bristol. Performs regularly at wine bars and supper clubs with a rotating trio.',
    city: 'Bristol',
    country: 'United Kingdom',
    genres: ['jazz', 'blues', 'pop'],
    musicLinks: [
      {
        platform: 'google_music',
        url: 'https://music.youtube.com/channel/UCnolavibe456',
        title: 'Nola Vibe on YouTube Music',
      },
      {
        platform: 'apple_music',
        url: 'https://music.apple.com/gb/artist/nola-vibe/1122334455',
        title: 'Nola Vibe on Apple Music',
      },
    ],
  },
];
