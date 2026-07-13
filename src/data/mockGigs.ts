/**
 * Mock gig data for local development.
 *
 * Uses Nashville, TN as the geographic center. Gigs are spread across
 * real Nashville venues with coordinates near downtown (36.1627, -86.7816).
 * Includes a mix of past and future dates to exercise all status filters.
 */

import type { Gig } from '@/types';

/**
 * Mocked user location — Nashville city center.
 * Used for map centering and "near you" calculations during development.
 */
export const MOCK_USER_LOCATION = {
  latitude: 36.1627,
  longitude: -86.7816,
} as const;

/**
 * Helper to produce an ISO date string offset from today by a number of days.
 * Positive values = future, negative = past.
 */
function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * 12 sample gigs covering:
 * - 8 genres: rock, jazz, blues, electronic, folk, classical, pop, country
 * - 7 venues across Nashville
 * - Statuses: 4 available, 4 accepted, 4 past
 * - Dates spanning past (-30 to -1) and future (+1 to +45)
 */
export const MOCK_GIGS: Gig[] = [
  // ─── Available gigs (future dates, no accepted musicians) ───────────────
  {
    id: 'gig-1',
    title: 'Friday Night Rock Showcase',
    venueName: 'The Bluebird Cafe',
    addressLine1: '4104 Hillsboro Pike',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37215',
    country: 'USA',
    latitude: 36.1065,
    longitude: -86.8168,
    date: offsetDate(3),
    startTime: '20:00',
    endTime: '23:00',
    genres: ['rock'],
    pay: 250,
    description:
      'Looking for a rock band or solo artist to headline our Friday showcase. High-energy crowd, great acoustics. PA and backline provided.',
    status: 'available',
    hosterId: 'hoster-1',
    acceptedMusicianIds: [],
  },
  {
    id: 'gig-2',
    title: 'Jazz Brunch Session',
    venueName: 'Rudy\'s Jazz Room',
    addressLine1: '809 Gleaves St',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37203',
    country: 'USA',
    latitude: 36.1512,
    longitude: -86.7818,
    date: offsetDate(7),
    startTime: '10:00',
    endTime: '13:00',
    genres: ['jazz'],
    pay: 300,
    description:
      'Relaxed Sunday brunch set. We need a jazz trio or duo comfortable with standards and light originals. Tip jar split included.',
    status: 'available',
    hosterId: 'hoster-2',
    acceptedMusicianIds: [],
  },
  {
    id: 'gig-3',
    title: 'Electronic Night at the Warehouse',
    venueName: 'Marathon Music Works',
    addressLine1: '1402 Clinton St',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37203',
    country: 'USA',
    latitude: 36.1725,
    longitude: -86.7981,
    date: offsetDate(14),
    startTime: '22:00',
    endTime: '02:00',
    genres: ['electronic', 'pop'],
    pay: 500,
    description:
      'DJ or electronic producer needed for our monthly warehouse party. Must bring own controller setup. Crowd of 300+.',
    status: 'available',
    hosterId: 'hoster-1',
    acceptedMusicianIds: [],
  },
  {
    id: 'gig-4',
    title: 'Folk Songwriter Circle',
    venueName: 'The Listening Room Cafe',
    addressLine1: '618 4th Ave S',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37210',
    country: 'USA',
    latitude: 36.1555,
    longitude: -86.7747,
    date: offsetDate(10),
    startTime: '19:00',
    endTime: '21:30',
    genres: ['folk', 'country'],
    pay: 150,
    description:
      'Intimate songwriter round — 4 artists trading songs. Acoustic only. Great networking opportunity with Nashville writers.',
    status: 'available',
    hosterId: 'hoster-2',
    acceptedMusicianIds: [],
  },

  // ─── Accepted gigs (future dates, at least one musician) ────────────────
  {
    id: 'gig-5',
    title: 'Blues on Broadway',
    venueName: 'Robert\'s Western World',
    addressLine1: '416 Broadway',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37203',
    country: 'USA',
    latitude: 36.1592,
    longitude: -86.7767,
    date: offsetDate(5),
    startTime: '21:00',
    endTime: '00:30',
    genres: ['blues', 'rock'],
    pay: 200,
    description:
      'Honky-tonk blues gig on Lower Broadway. Cover-heavy set preferred. Tips can double your pay on a good night.',
    status: 'accepted',
    hosterId: 'hoster-1',
    acceptedMusicianIds: ['musician-1'],
  },
  {
    id: 'gig-6',
    title: 'Country Classics Night',
    venueName: 'The Stage on Broadway',
    addressLine1: '412 Broadway',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37203',
    country: 'USA',
    latitude: 36.1591,
    longitude: -86.7769,
    date: offsetDate(12),
    startTime: '20:00',
    endTime: '23:30',
    genres: ['country'],
    pay: 275,
    description:
      'Looking for a country act to cover classic Nashville hits. Outlaw country vibe welcome. Great crowd energy.',
    status: 'accepted',
    hosterId: 'hoster-2',
    acceptedMusicianIds: ['musician-2'],
  },
  {
    id: 'gig-7',
    title: 'Pop Cover Band Night',
    venueName: 'Marathon Music Works',
    addressLine1: '1402 Clinton St',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37203',
    country: 'USA',
    latitude: 36.1725,
    longitude: -86.7981,
    date: offsetDate(20),
    startTime: '19:30',
    endTime: '22:00',
    genres: ['pop', 'rock'],
    pay: 400,
    description:
      'Full band needed for pop covers night. Current top-40 and 2010s hits. Sound engineer provided.',
    status: 'accepted',
    hosterId: 'hoster-1',
    acceptedMusicianIds: ['musician-1', 'musician-3'],
  },
  {
    id: 'gig-8',
    title: 'Classical Ensemble for Private Event',
    venueName: 'Schermerhorn Symphony Center',
    addressLine1: '1 Symphony Pl',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37201',
    country: 'USA',
    latitude: 36.1574,
    longitude: -86.7761,
    date: offsetDate(30),
    startTime: '18:00',
    endTime: '20:00',
    genres: ['classical'],
    pay: 600,
    description:
      'String quartet or small ensemble needed for a corporate reception in the lobby. Formal attire required. Sheet music provided.',
    status: 'accepted',
    hosterId: 'hoster-2',
    acceptedMusicianIds: ['musician-2', 'musician-3'],
  },

  // ─── Past gigs (past dates) ────────────────────────────────────────────
  {
    id: 'gig-9',
    title: 'Last Month\'s Rock Night',
    venueName: 'Exit/In',
    addressLine1: '2208 Elliston Pl',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37203',
    country: 'USA',
    latitude: 36.1529,
    longitude: -86.8032,
    date: offsetDate(-30),
    startTime: '21:00',
    endTime: '23:30',
    genres: ['rock'],
    pay: 225,
    description:
      'Three-band bill at Exit/In. 45-minute sets each. Sold out crowd, great energy.',
    status: 'past',
    hosterId: 'hoster-1',
    acceptedMusicianIds: ['musician-1'],
  },
  {
    id: 'gig-10',
    title: 'Jazz Standards Evening',
    venueName: 'Rudy\'s Jazz Room',
    addressLine1: '809 Gleaves St',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37203',
    country: 'USA',
    latitude: 36.1512,
    longitude: -86.7818,
    date: offsetDate(-14),
    startTime: '19:00',
    endTime: '22:00',
    genres: ['jazz', 'blues'],
    pay: 350,
    description:
      'Quartet performed jazz standards to a full house. Great tips from an appreciative audience.',
    status: 'past',
    hosterId: 'hoster-2',
    acceptedMusicianIds: ['musician-2'],
  },
  {
    id: 'gig-11',
    title: 'Electronic Open Decks',
    venueName: 'The Basement East',
    addressLine1: '917 Woodland St',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37206',
    country: 'USA',
    latitude: 36.1693,
    longitude: -86.7601,
    date: offsetDate(-7),
    startTime: '22:00',
    endTime: '02:00',
    genres: ['electronic'],
    pay: 175,
    description:
      'Open decks night with rotating DJs. 30-minute sets, all sub-genres welcome.',
    status: 'past',
    hosterId: 'hoster-1',
    acceptedMusicianIds: ['musician-3'],
  },
  {
    id: 'gig-12',
    title: 'Bluegrass Picker\'s Circle',
    venueName: 'Station Inn',
    addressLine1: '402 12th Ave S',
    addressLine2: '',
    city: 'Nashville',
    postcode: '37203',
    country: 'USA',
    latitude: 36.1528,
    longitude: -86.7862,
    date: offsetDate(-2),
    startTime: '19:00',
    endTime: '21:00',
    genres: ['folk'],
    pay: 125,
    description:
      'Weekly picker\'s circle at the legendary Station Inn. Acoustic instruments only. All skill levels.',
    status: 'past',
    hosterId: 'hoster-2',
    acceptedMusicianIds: ['musician-1', 'musician-2'],
  },
];
