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

/** Fixed coordinate lookup by city name (UK cities) */
const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  london: { latitude: 51.5074, longitude: -0.1278 },
  manchester: { latitude: 53.4808, longitude: -2.2426 },
  bristol: { latitude: 51.4545, longitude: -2.5879 },
};

const DEFAULT_COORDINATES = { latitude: 51.5074, longitude: -0.1278 };

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
