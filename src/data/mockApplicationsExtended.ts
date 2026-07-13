/**
 * Extended mock applications with full musician profile data.
 *
 * Used for developing the hoster dashboard where applications
 * are displayed alongside musician details (bio, genres, links).
 */

import type { ApplicationWithProfile } from '@/types';

export const mockApplicationsExtended: ApplicationWithProfile[] = [
  {
    id: 'app-ext-1',
    gigId: 'gig-1',
    musicianId: 'musician-1',
    status: 'pending',
    message:
      'Hey! I love playing at The Bluebird. My rock set would be a great fit for Friday nights.',
    createdAt: '2025-01-10T14:30:00.000Z',
    musician: {
      id: 'musician-1',
      displayName: 'Rae Holloway',
      role: 'musician',
      avatarUrl: null,
      bio: 'Nashville-based rock and blues guitarist with 8 years of live performance experience. Comfortable leading a band or playing solo with a loop pedal.',
      city: 'Nashville',
      country: 'USA',
      genres: ['rock', 'blues'],
      musicLinks: [
        {
          platform: 'apple_music',
          url: 'https://music.apple.com/artist/rae-holloway',
          title: 'Rae Holloway on Apple Music',
        },
      ],
    },
  },
  {
    id: 'app-ext-2',
    gigId: 'gig-2',
    musicianId: 'musician-2',
    status: 'accepted',
    message:
      'Jazz brunch is my specialty. I run a trio that covers standards and bossa nova — perfect for a relaxed Sunday.',
    createdAt: '2025-01-08T09:15:00.000Z',
    musician: {
      id: 'musician-2',
      displayName: 'Dex Cadence',
      role: 'musician',
      avatarUrl: null,
      bio: 'Jazz pianist and composer. Classically trained at Belmont with a deep love for improvisation. Available for solo, duo, or trio formats.',
      city: 'Nashville',
      country: 'USA',
      genres: ['jazz', 'classical'],
      musicLinks: [
        {
          platform: 'google_music',
          url: 'https://music.youtube.com/channel/dex-cadence',
          title: 'Dex Cadence on YouTube Music',
        },
        {
          platform: 'apple_music',
          url: 'https://music.apple.com/artist/dex-cadence',
          title: 'Dex Cadence on Apple Music',
        },
      ],
    },
  },
  {
    id: 'app-ext-3',
    gigId: 'gig-1',
    musicianId: 'musician-3',
    status: 'pending',
    message: null,
    createdAt: '2025-01-11T18:45:00.000Z',
    musician: {
      id: 'musician-3',
      displayName: 'Nola Vibe',
      role: 'musician',
      avatarUrl: null,
      bio: 'Electronic producer and DJ blending house, funk, and pop. Also plays guitar and keys for live hybrid sets.',
      city: 'Atlanta',
      country: 'USA',
      genres: ['electronic', 'pop'],
      musicLinks: [
        {
          platform: 'apple_music',
          url: 'https://music.apple.com/artist/nola-vibe',
          title: 'Nola Vibe on Apple Music',
        },
      ],
    },
  },
  {
    id: 'app-ext-4',
    gigId: 'gig-3',
    musicianId: 'musician-3',
    status: 'pending',
    message:
      'This warehouse party sounds incredible. I have a full controller rig and can bring visuals too.',
    createdAt: '2025-01-12T22:00:00.000Z',
    musician: {
      id: 'musician-3',
      displayName: 'Nola Vibe',
      role: 'musician',
      avatarUrl: null,
      bio: 'Electronic producer and DJ blending house, funk, and pop. Also plays guitar and keys for live hybrid sets.',
      city: 'Atlanta',
      country: 'USA',
      genres: ['electronic', 'pop'],
      musicLinks: [
        {
          platform: 'apple_music',
          url: 'https://music.apple.com/artist/nola-vibe',
          title: 'Nola Vibe on Apple Music',
        },
      ],
    },
  },
  {
    id: 'app-ext-5',
    gigId: 'gig-4',
    musicianId: 'musician-1',
    status: 'declined',
    message:
      'Would love to join the songwriter circle. I have a few folk originals that fit the vibe.',
    createdAt: '2025-01-09T16:20:00.000Z',
    musician: {
      id: 'musician-1',
      displayName: 'Rae Holloway',
      role: 'musician',
      avatarUrl: null,
      bio: 'Nashville-based rock and blues guitarist with 8 years of live performance experience. Comfortable leading a band or playing solo with a loop pedal.',
      city: 'Nashville',
      country: 'USA',
      genres: ['rock', 'blues'],
      musicLinks: [
        {
          platform: 'apple_music',
          url: 'https://music.apple.com/artist/rae-holloway',
          title: 'Rae Holloway on Apple Music',
        },
      ],
    },
  },
  {
    id: 'app-ext-6',
    gigId: 'gig-5',
    musicianId: 'musician-2',
    status: 'declined',
    message: null,
    createdAt: '2025-01-07T11:00:00.000Z',
    musician: {
      id: 'musician-2',
      displayName: 'Dex Cadence',
      role: 'musician',
      avatarUrl: null,
      bio: 'Jazz pianist and composer. Classically trained at Belmont with a deep love for improvisation. Available for solo, duo, or trio formats.',
      city: 'Nashville',
      country: 'USA',
      genres: ['jazz', 'classical'],
      musicLinks: [
        {
          platform: 'google_music',
          url: 'https://music.youtube.com/channel/dex-cadence',
          title: 'Dex Cadence on YouTube Music',
        },
        {
          platform: 'apple_music',
          url: 'https://music.apple.com/artist/dex-cadence',
          title: 'Dex Cadence on Apple Music',
        },
      ],
    },
  },
];
