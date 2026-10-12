/**
 * Geocoding Service — Mock Implementation
 *
 * This is a mock implementation returning fixed coordinates for development.
 * It simulates async behavior to mimic a real geocoding API call.
 *
 * To swap in a real geocoding API (e.g., Google Maps, Mapbox, OpenCage):
 * 1. Install the provider's SDK or use their REST API
 * 2. Replace the body of `geocodeAddress` with a real API call:
 *    - Google Maps: https://developers.google.com/maps/documentation/geocoding
 *    - Mapbox: https://docs.mapbox.com/api/search/geocoding/
 *    - OpenCage: https://opencagedata.com/api
 * 3. Replace the body of `reverseGeocode` similarly
 * 4. Add your API key to environment variables (never hardcode)
 * 5. Handle rate limiting and error responses from the provider
 */

/**
 * Result returned by the geocoding service.
 */
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

/** Fixed coordinate lookup by city name.
 *
 * Nashville-area US cities are the primary set so manual location entry
 * visibly changes which gigs are "near" the user (the mock gigs live around
 * Nashville). A few UK cities are retained for the gig-creation geocode path.
 */
const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  // ─── Nashville, TN area (matches MOCK_GIGS) ───────────────────────────────
  nashville: { latitude: 36.1627, longitude: -86.7816 },
  franklin: { latitude: 35.9251, longitude: -86.8689 },
  murfreesboro: { latitude: 35.8456, longitude: -86.3903 },
  brentwood: { latitude: 36.0331, longitude: -86.7828 },
  hendersonville: { latitude: 36.3048, longitude: -86.6200 },
  'mount juliet': { latitude: 36.2003, longitude: -86.5186 },
  // ─── Other Tennessee / nearby US cities ───────────────────────────────────
  memphis: { latitude: 35.1495, longitude: -90.049 },
  knoxville: { latitude: 35.9606, longitude: -83.9207 },
  chattanooga: { latitude: 35.0456, longitude: -85.3097 },
  // ─── UK cities (legacy, used by gig-creation geocode) ─────────────────────
  london: { latitude: 51.5074, longitude: -0.1278 },
  manchester: { latitude: 53.4808, longitude: -2.2426 },
  bristol: { latitude: 51.4545, longitude: -2.5879 },
};

const DEFAULT_COORDINATES = { latitude: 36.1627, longitude: -86.7816 };

/**
 * Pure city-name → coordinates lookup against the mock table.
 *
 * Case-insensitive and whitespace-trimmed. Returns null for an empty string or
 * an unknown city (callers decide how to handle a miss, e.g. keep the current
 * location). Pure and synchronous so it is trivial to unit/property test; the
 * async {@link geocodeCity} wrapper simulates network latency for the UI.
 */
export function lookupCityCoordinates(
  city: string
): { latitude: number; longitude: number } | null {
  const key = city.trim().toLowerCase();
  if (key.length === 0) {
    return null;
  }
  return CITY_COORDINATES[key] ?? null;
}

/**
 * Geocodes a city name into a {@link GeocodingResult}, mimicking an async API.
 *
 * Mock implementation backed by {@link lookupCityCoordinates}. Returns null when
 * the city is empty or unknown so the caller can surface "city not found" rather
 * than silently snapping to a default.
 */
export async function geocodeCity(city: string): Promise<GeocodingResult | null> {
  const coords = lookupCityCoordinates(city);
  if (!coords) {
    return null;
  }

  // Simulate async API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Title-case the input for a tidy display label.
  const formattedAddress = city
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    formattedAddress,
  };
}

/**
 * Geocodes a structured address into latitude/longitude coordinates.
 *
 * Mock implementation: returns fixed coordinates based on city name.
 * Returns null if address is empty.
 *
 * @param address - Street address line
 * @param city - City name
 * @param postcode - Postal code
 * @param country - Country name
 * @returns GeocodingResult with coordinates, or null if address is empty
 */
export async function geocodeAddress(
  address: string,
  city: string,
  postcode: string,
  country: string
): Promise<GeocodingResult | null> {
  if (!address.trim()) {
    return null;
  }

  // Simulate async API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const cityLower = city.trim().toLowerCase();
  const coords = CITY_COORDINATES[cityLower] ?? DEFAULT_COORDINATES;

  const formattedAddress = [address, city, postcode, country]
    .filter((part) => part.trim().length > 0)
    .join(', ');

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    formattedAddress,
  };
}

/**
 * Reverse geocodes latitude/longitude coordinates into a human-readable address.
 *
 * Mock implementation: returns a generic address string for any valid coordinates.
 * Returns null if both coordinates are exactly 0 (null island).
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Formatted address string, or null for invalid coordinates
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (latitude === 0 && longitude === 0) {
    return null;
  }

  // Simulate async API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return 'Mock Address, City';
}
